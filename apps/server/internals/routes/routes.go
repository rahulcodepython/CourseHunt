package routes

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/controllers"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/razorpay"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
)

type Router struct {
	App   *fiber.App
	API   fiber.Router
	DB    *sqlx.DB
	CFG   *config.Config
	Cache *cache.Cache

	Health        *controllers.HealthController
	Notifications *controllers.NotificationsController
	Logs          *controllers.LogsController
	Security      *controllers.SecurityController
	Monitoring    *controllers.MonitoringController
	Wishlist      *controllers.WishlistController
	Categories    *controllers.CategoriesController
	Certificates  *controllers.CertificatesController
	Notes         *controllers.NotesController
	Discussions   *controllers.DiscussionsController
	Users         *controllers.UsersController
	Dashboard     *controllers.DashboardController
	Updates       *controllers.UpdatesController
	Feedbacks     *controllers.FeedbacksController
	Coupons       *controllers.CouponsController
	Quiz          *controllers.QuizController
	Enrollments   *controllers.EnrollmentsController
	Chapters      *controllers.ChaptersController
	Faqs          *controllers.FaqsController
	Lessons       *controllers.LessonsController
	Courses       *controllers.CoursesController
	Transactions  *controllers.TransactionsController
	Upload        *controllers.UploadController
	Roles         *controllers.RolesController
	Profile       *controllers.ProfileController

	UsersRepo *repositories.UsersRepository
}

func NewRouter(app *fiber.App, db *sqlx.DB, rdb *redis.Client, cfg *config.Config) *Router {
	cch := cache.NewCache(rdb)

	enrollmentsRepo := repositories.NewEnrollmentsRepository(db)
	coursesRepo := repositories.NewCoursesRepository(db, enrollmentsRepo, cch)

	wishlistRepo := repositories.NewWishlistRepository(db, cch)
	categoriesRepo := repositories.NewCategoriesRepository(db, cch)
	certificatesRepo := repositories.NewCertificatesRepository(db, enrollmentsRepo)
	dashboardRepo := repositories.NewDashboardRepository(db)
	notesRepo := repositories.NewNotesRepository(db, enrollmentsRepo, cch)
	discussionsRepo := repositories.NewDiscussionsRepository(db, enrollmentsRepo, coursesRepo)
	usersRepo := repositories.NewUsersRepository(db)
	updatesRepo := repositories.NewUpdatesRepository(db, cch)
	feedbacksRepo := repositories.NewFeedbacksRepository(db, enrollmentsRepo, coursesRepo, cch)
	couponsRepo := repositories.NewCouponsRepository(db, coursesRepo, cch)
	quizRepo := repositories.NewQuizRepository(db, enrollmentsRepo, coursesRepo, cch)
	chaptersRepo := repositories.NewChaptersRepository(db, coursesRepo, cch)
	faqsRepo := repositories.NewFaqsRepository(db, cch)
	lessonsRepo := repositories.NewLessonsRepository(db, coursesRepo, cch)
	rolesRepo := repositories.NewRolesRepository(db, cch)
	notificationsRepo := repositories.NewNotificationsRepository(db)
	logsRepo := repositories.NewLogsRepository(db)
	securityRepo := repositories.NewSecurityRepository(db)

	rzp := razorpay.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret, cfg.RazorpayBaseURL)
	transactionsRepo := repositories.NewTransactionsRepository(db)

	couponsSvc := services.NewCouponsService(couponsRepo)
	quizSvc := services.NewQuizService(db, quizRepo, enrollmentsRepo, coursesRepo)
	transactionsSvc := services.NewTransactionsService(transactionsRepo, cfg, rzp, couponsSvc)

	return &Router{
		App: app, API: app.Group("/api"), DB: db, CFG: cfg, Cache: cch,
		Health:        controllers.NewHealthController(db, cch, cfg),
		Notifications: controllers.NewNotificationsController(notificationsRepo, cfg),
		Logs:          controllers.NewLogsController(logsRepo, cfg),
		Security:      controllers.NewSecurityController(securityRepo, cfg),
		Monitoring:    controllers.NewMonitoringController(db, cch, cfg),
		Wishlist:      controllers.NewWishlistController(wishlistRepo, cfg),
		Categories:    controllers.NewCategoriesController(categoriesRepo, cfg),
		Certificates:  controllers.NewCertificatesController(certificatesRepo, cfg),
		Notes:         controllers.NewNotesController(notesRepo, cfg),
		Discussions:   controllers.NewDiscussionsController(discussionsRepo, cfg),
		Users:         controllers.NewUsersController(usersRepo, cfg),
		Dashboard:     controllers.NewDashboardController(dashboardRepo, cfg),
		Updates:       controllers.NewUpdatesController(updatesRepo, cfg),
		Feedbacks:     controllers.NewFeedbacksController(feedbacksRepo, cfg),
		Coupons:       controllers.NewCouponsController(couponsSvc, couponsRepo, cfg),
		Quiz:          controllers.NewQuizController(quizSvc, quizRepo, cfg),
		Enrollments:   controllers.NewEnrollmentsController(enrollmentsRepo, cfg),
		Chapters:      controllers.NewChaptersController(chaptersRepo, cfg),
		Faqs:          controllers.NewFaqsController(faqsRepo, cfg),
		Lessons:       controllers.NewLessonsController(lessonsRepo, cfg),
		Courses:       controllers.NewCoursesController(coursesRepo, cfg),
		Transactions:  controllers.NewTransactionsController(transactionsSvc, transactionsRepo, cfg),
		Upload:        controllers.NewUploadController(cfg),
		Roles:         controllers.NewRolesController(rolesRepo, cfg),
		Profile:       controllers.NewProfileController(usersRepo, cfg),
		UsersRepo:     usersRepo,
	}
}

func (r *Router) SetUp() {
	r.App.Use(middlewares.LoggerMiddleware(r.DB))
	r.App.Use(recover.New())
	// CORS must run before the rate limiter (and any other middleware that
	// can short-circuit the chain with an early response). Fiber applies
	// middleware in registration order, so a 429 thrown by a limiter
	// registered ahead of cors.New() never passes back through it — the
	// response leaves with no Access-Control-Allow-Origin header at all.
	// Browsers treat a cross-origin response with no CORS headers as a
	// total network failure (XHR status 0 / fetch "Failed to fetch"), not a
	// readable 429 — every rate-limited request from the actual frontend
	// (a different origin/port from this API) silently looked like the
	// backend was down instead of "too many requests, retry after Ns".
	r.App.Use(cors.New(cors.Config{
		AllowOrigins:     r.CFG.AllowedOrigins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))
	r.App.Use(middlewares.RateLimiterMiddleware())

	// r.API is already "/api" (see NewRouter above), so this group only needs "/v1" —
	// do NOT add "/api/v1" here or in any route below, or paths double up
	// (e.g. /api/v1/auth/login becomes /api/v1/api/v1/auth/login).
	//
	// ============================================================
	// BLOCK 1 — ALL PUBLIC ROUTES GO HERE.
	// DO NOT REGISTER ANY PUBLIC ROUTE AFTER "protected :=" BELOW.
	// Route matching here is stack-order + prefix based: a route
	// registered after the auth middleware group is created will be
	// auth-gated regardless of which variable (public/protected)
	// you call it on, because both groups share the same "/v1" prefix.
	// ============================================================
	public := r.API.Group("/v1")

	public.Get("/health", r.Health.HealthCheckController)

	public.Get("/categories", r.Categories.ListController)
	public.Get("/courses", r.Courses.PublicListController)
	public.Get("/courses/course/:slug", r.Courses.PublicSingleController)
	public.Get("/feedbacks/pinned", r.Feedbacks.ListPinnedController)
	public.Get("/faqs/public", r.Faqs.PublicListController)
	public.Get("/certificates/verify/:id", r.Certificates.VerifyController)
	public.Post("/transactions/webhook", r.Transactions.WebhookController)

	// ============================================================
	// BLOCK 2 — AUTH MIDDLEWARE CREATED HERE. NOTHING PUBLIC BELOW THIS LINE.
	// ============================================================
	protected := r.API.Group("/v1", middlewares.BaseAuthMiddleware(r.CFG, r.Cache, r.UsersRepo))

	// ============================================================
	// BLOCK 3 — ALL PROTECTED ROUTES.
	// ============================================================
	// Plain "user" accounts don't participate in the permission system —
	// these are self-scoped (utils.GetUserID) and only need authentication,
	// already required by the protected group.
	protected.Get("/wishlist", r.Wishlist.ListController)
	protected.Post("/wishlist", r.Wishlist.CreateController)
	protected.Delete("/wishlist/:id", r.Wishlist.DeleteController)
	protected.Delete("/wishlist", r.Wishlist.ClearController)

	protected.Post("/categories", middlewares.PermissionGuard(generic.PermAdminCategoriesManage), r.Categories.CreateController)
	protected.Patch("/categories/:id", middlewares.PermissionGuard(generic.PermAdminCategoriesManage), r.Categories.UpdateController)
	protected.Delete("/categories/:id", middlewares.PermissionGuard(generic.PermAdminCategoriesManage), r.Categories.DeleteController)

	protected.Get("/certificates", r.Certificates.ListController)
	protected.Post("/certificates/claim/course/:courseID", r.Certificates.ClaimController)

	protected.Get("/notes", r.Notes.ReadController)
	protected.Post("/notes", r.Notes.UpsertController)
	protected.Patch("/notes/:id", r.Notes.UpdateController)
	protected.Delete("/notes/:id", r.Notes.DeleteController)

	// Discussions mix elevated admin/tutor access (any discussion) with plain
	// self-scoped user access (own enrolled-course discussions, enforced by
	// ErrDiscussionsNotEnrolled in the repository) — ScopeGuard records the
	// elevated permission when present and otherwise defaults to ScopeUser.
	discussionElevatedPerms := []string{
		generic.PermAdminDiscussionRead, generic.PermAdminDiscussionWrite, generic.PermAdminDiscussionDelete,
		generic.PermTutorDiscussionRead, generic.PermTutorDiscussionWrite, generic.PermTutorDiscussionDelete,
	}
	protected.Get("/discussions/:lessonId", middlewares.ScopeGuard(discussionElevatedPerms...), r.Discussions.ListController)
	protected.Get("/discussions/replies/:id", middlewares.ScopeGuard(discussionElevatedPerms...), r.Discussions.ListRepliesController)
	protected.Post("/discussions", middlewares.ScopeGuard(discussionElevatedPerms...), r.Discussions.CreateController)
	protected.Patch("/discussions/:id", middlewares.ScopeGuard(discussionElevatedPerms...), r.Discussions.UpdateController)
	protected.Delete("/discussions/:id", middlewares.ScopeGuard(discussionElevatedPerms...), r.Discussions.DeleteController)

	protected.Get("/users", middlewares.PermissionGuard(generic.PermAdminUsersList), r.Users.ListController)
	protected.Post("/users/:id/roles/assign", middlewares.PermissionGuard(generic.PermAdminUsersRoleAssign), r.Users.AssignRoleController)
	protected.Post("/users/:id/roles/revoke", middlewares.PermissionGuard(generic.PermAdminUsersRoleRevoke), r.Users.DeleteRoleController)

	// The own-profile endpoints read/update the caller's own profile via
	// utils.GetUserID — self-scoped for any segment, no permission needed.
	// The separate "list everyone's profiles" endpoint below stays elevated.
	protected.Get("/profile/user", r.Profile.ReadUserProfileController)
	protected.Post("/profile/user", r.Profile.UpsertUserProfileController)
	protected.Get("/profile/tutor", r.Profile.ReadTutorProfileController)
	protected.Post("/profile/tutor", r.Profile.UpsertTutorProfileController)
	protected.Get("/profile/admin", middlewares.PermissionGuard(generic.PermAdminProfile), r.Profile.AdminListProfilesController)

	// Dashboard access is a guaranteed fallback of segment membership, not a
	// revocable permission — admin/tutor dashboards return segment-wide data
	// so they're still restricted to that segment; the user dashboard is
	// self-scoped and harmless for any segment to call.
	protected.Get("/dashboard/user", r.Dashboard.UserDashboardController)
	protected.Get("/dashboard/tutor", middlewares.RoleGuard(generic.RoleTutor), r.Dashboard.TutorDashboardController)
	protected.Get("/dashboard/admin", middlewares.RoleGuard(generic.RoleAdmin), r.Dashboard.AdminDashboardController)

	protected.Get("/updates/feed", r.Updates.FeedController)
	protected.Get("/updates", middlewares.PermissionGuard(generic.PermTutorUpdatesManage, generic.PermAdminUpdatesManage), r.Updates.ListController)
	protected.Post("/updates", middlewares.PermissionGuard(generic.PermTutorUpdatesManage, generic.PermAdminUpdatesManage), r.Updates.CreateController)
	protected.Patch("/updates/:id", middlewares.PermissionGuard(generic.PermTutorUpdatesManage, generic.PermAdminUpdatesManage), r.Updates.UpdateController)
	protected.Delete("/updates/:id", middlewares.PermissionGuard(generic.PermTutorUpdatesManage, generic.PermAdminUpdatesManage), r.Updates.DeleteController)

	protected.Post("/feedbacks", r.Feedbacks.CreateController)
	protected.Get("/feedbacks", middlewares.PermissionGuard(generic.PermAdminFeedbackInspect, generic.PermTutorFeedbackManage), r.Feedbacks.ListController)
	protected.Patch("/feedbacks/:id", middlewares.PermissionGuard(generic.PermAdminFeedbackInspect), r.Feedbacks.UpdateController)
	protected.Delete("/feedbacks/:id", middlewares.PermissionGuard(generic.PermAdminFeedbackInspect, generic.PermTutorFeedbackManage), r.Feedbacks.DeleteController)

	protected.Get("/coupons", middlewares.PermissionGuard(generic.PermAdminCouponsManage, generic.PermTutorCouponsManage), r.Coupons.ListController)
	protected.Post("/coupons", middlewares.PermissionGuard(generic.PermAdminCouponsManage, generic.PermTutorCouponsManage), r.Coupons.CreateController)
	protected.Patch("/coupons/:id", middlewares.PermissionGuard(generic.PermAdminCouponsManage, generic.PermTutorCouponsManage), r.Coupons.UpdateController)
	protected.Delete("/coupons/:id", middlewares.PermissionGuard(generic.PermAdminCouponsManage, generic.PermTutorCouponsManage), r.Coupons.DeleteController)
	protected.Get("/coupons/check", r.Coupons.CheckController)

	protected.Post("/quiz/metadata", middlewares.PermissionGuard(generic.PermTutorQuizManage), r.Quiz.CreateMetadataController)
	protected.Get("/quiz/metadata", middlewares.PermissionGuard(generic.PermTutorQuizManage, generic.PermAdminCoursesInspect), r.Quiz.ReadMetadataController)
	protected.Post("/quiz/questions", middlewares.PermissionGuard(generic.PermTutorQuizManage), r.Quiz.CreateQuestionController)
	protected.Get("/quiz/questions", middlewares.PermissionGuard(generic.PermTutorQuizManage, generic.PermAdminCoursesInspect), r.Quiz.ListQuestionsController)
	protected.Patch("/quiz/questions/:id", middlewares.PermissionGuard(generic.PermTutorQuizManage), r.Quiz.UpdateQuestionController)
	protected.Delete("/quiz/questions/:id", middlewares.PermissionGuard(generic.PermTutorQuizManage), r.Quiz.DeleteQuestionController)
	protected.Post("/quiz/question", r.Quiz.GetQuestionController)
	protected.Post("/quiz/submit", r.Quiz.CreateSubmitController)
	protected.Get("/quiz/attempts", r.Quiz.ListAttemptsController)
	protected.Get("/quiz/attempts/:id", r.Quiz.GetAttemptDetailController)

	protected.Get("/enrollments", middlewares.ScopeGuard(generic.PermAdminEnrollmentsInspect), r.Enrollments.ListController)
	protected.Post("/enrollments/:userId/:courseId/revoke", middlewares.PermissionGuard(generic.PermAdminRevokeCourse), r.Enrollments.RevokeController)
	protected.Post("/enrollments/:userId/:courseId/regain", middlewares.PermissionGuard(generic.PermAdminRevokeCourse), r.Enrollments.RegainController)

	protected.Get("/chapters", middlewares.PermissionGuard(generic.PermTutorCoursesManage, generic.PermAdminCoursesInspect), r.Chapters.ListController)
	protected.Post("/chapters", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Chapters.CreateController)
	protected.Patch("/chapters/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Chapters.UpdateController)
	protected.Delete("/chapters/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Chapters.DeleteController)

	protected.Get("/faqs", middlewares.PermissionGuard(generic.PermTutorCoursesManage, generic.PermAdminCoursesInspect), r.Faqs.ListController)
	protected.Post("/faqs", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Faqs.CreateController)
	protected.Patch("/faqs/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Faqs.UpdateController)
	protected.Delete("/faqs/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Faqs.DeleteController)

	protected.Get("/lessons", middlewares.PermissionGuard(generic.PermTutorCoursesManage, generic.PermAdminCoursesInspect), r.Lessons.ListController)
	protected.Post("/lessons", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.CreateController)
	protected.Patch("/lessons/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.UpdateController)
	protected.Delete("/lessons/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.DeleteController)
	protected.Get("/lessons/:id/content", middlewares.ScopeGuard(generic.PermAdminCoursesInspect), r.Lessons.ReadContentController)
	protected.Post("/lessons/:id/complete", r.Lessons.UpdateCompleteController)
	protected.Get("/lessons/:id/resources", middlewares.ScopeGuard(generic.PermAdminCoursesInspect), r.Lessons.ReadResourcesController)
	// Tutor-authoring reads: ownership-gated, not enrollment-gated — a tutor
	// is never "enrolled" in their own course.
	protected.Get("/lessons/:id/manage/content", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.ReadContentForTutorController)
	protected.Get("/lessons/:id/manage/resources", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.ReadResourcesForTutorController)
	protected.Post("/lessons/:id/video", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.UpsertVideoContentController)
	protected.Post("/lessons/:id/document", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.UpsertDocumentContentController)
	protected.Post("/lessons/:id/resources", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.CreateResourceController)
	protected.Delete("/lessons/:id/resources/:resourceID", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Lessons.DeleteResourceController)

	protected.Get("/courses/:id/study", r.Courses.StudyController)
	protected.Get("/courses/enrolled", r.Courses.EnrolledListController)
	protected.Post("/courses/:id/enroll", r.Courses.EnrollFreeController)
	protected.Get("/courses/manage", middlewares.PermissionGuard(generic.PermTutorCoursesManage, generic.PermAdminCoursesInspect), r.Courses.ManageListController)
	protected.Get("/courses/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage, generic.PermAdminCoursesInspect), r.Courses.GetByIDController)
	protected.Post("/courses", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Courses.CreateController)
	protected.Patch("/courses/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Courses.UpdateController)
	protected.Delete("/courses/:id", middlewares.PermissionGuard(generic.PermTutorCoursesManage), r.Courses.DeleteController)

	protected.Post("/transactions/initiate", r.Transactions.CreateController)
	protected.Get("/transactions/checkout/course/:courseId", r.Transactions.CheckoutController)
	protected.Get("/transactions/:id/status", r.Transactions.StatusController)
	protected.Get("/transactions", middlewares.ScopeGuard(generic.PermAdminTransactionsReadAll), r.Transactions.ListController)

	protected.Get("/upload/signed-url", r.Upload.GetSignedURLController)

	protected.Get("/roles", middlewares.PermissionGuard(generic.PermAdminRolesRead), r.Roles.ListRolesController)
	protected.Post("/roles", middlewares.PermissionGuard(generic.PermAdminRolesCreate), r.Roles.CreateRoleController)
	protected.Put("/roles/:id", middlewares.PermissionGuard(generic.PermAdminRolesUpdate), r.Roles.UpdateRoleController)
	protected.Delete("/roles/:id", middlewares.PermissionGuard(generic.PermAdminRolesDelete), r.Roles.DeleteRoleController)
	protected.Get("/roles/:id/permissions", middlewares.PermissionGuard(generic.PermAdminRolesRead), r.Roles.GetRolePermissionsController)
	protected.Put("/roles/:id/permissions", middlewares.PermissionGuard(generic.PermAdminRolesUpdate), r.Roles.SetRolePermissionsController)
	protected.Get("/permissions", middlewares.PermissionGuard(generic.PermAdminRolesRead), r.Roles.ListPermissionsController)

	// Notifications: shared admin/tutor feed, role-filtered inside the
	// repository — any authenticated account may call this (a plain "user"
	// account just gets an empty list back, see NotificationsController).
	protected.Get("/notifications", r.Notifications.ListController)

	// Logs/Security/Monitoring are admin-only.
	protected.Get("/logs", middlewares.RoleGuard(generic.RoleAdmin), r.Logs.ListController)
	protected.Get("/security/events", middlewares.RoleGuard(generic.RoleAdmin), r.Security.ListEventsController)
	protected.Get("/security/stats", middlewares.RoleGuard(generic.RoleAdmin), r.Security.StatsController)
	protected.Get("/monitoring", middlewares.RoleGuard(generic.RoleAdmin), r.Monitoring.SnapshotController)
}
