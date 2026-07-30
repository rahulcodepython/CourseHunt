package routes

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/controllers"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/minio"
	"coursehunt/server/internals/pkg/razorpay"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/services"
	"coursehunt/server/internals/utils"

	"coursehunt/server/internals/generic"

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

	Auth         *controllers.AuthController
	Wishlist     *controllers.WishlistController
	Categories   *controllers.CategoriesController
	Certificates *controllers.CertificatesController
	Notes        *controllers.NotesController
	Discussions  *controllers.DiscussionsController
	Users        *controllers.UsersController
	Dashboard    *controllers.DashboardController
	Updates      *controllers.UpdatesController
	Feedbacks    *controllers.FeedbacksController
	Coupons      *controllers.CouponsController
	Quiz         *controllers.QuizController
	Enrollments  *controllers.EnrollmentsController
	Chapters     *controllers.ChaptersController
	Lessons      *controllers.LessonsController
	Courses      *controllers.CoursesController
	Transactions *controllers.TransactionsController
	Upload       *controllers.UploadController
	Roles        *controllers.RolesController
	Profile      *controllers.ProfileController
}

func NewRouter(app *fiber.App, db *sqlx.DB, rdb *redis.Client, cfg *config.Config) *Router {
	cch := cache.NewCache(rdb)

	enrollmentsRepo := repositories.NewEnrollmentsRepository(db)
	coursesRepo := repositories.NewCoursesRepository(db, enrollmentsRepo, cch)

	authRepo := repositories.NewAuthRepository(db)
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
	lessonsRepo := repositories.NewLessonsRepository(db, coursesRepo, cch)
	rolesRepo := repositories.NewRolesRepository(db, cch)

	rzp := razorpay.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret, cfg.RazorpayBaseURL)
	transactionsRepo := repositories.NewTransactionsRepository(db, couponsRepo, coursesRepo, enrollmentsRepo, rzp, cfg)

	authSvc := services.NewAuthService(authRepo, cfg)
	couponsSvc := services.NewCouponsService(couponsRepo)
	quizSvc := services.NewQuizService(db, quizRepo, enrollmentsRepo, coursesRepo)
	transactionsSvc := services.NewTransactionsService(db, transactionsRepo, cfg, rzp, couponsSvc, enrollmentsRepo)

	return &Router{
		App: app, API: app.Group("/api"), DB: db, CFG: cfg, Cache: cch,
		Auth:         controllers.NewAuthController(authSvc, cfg),
		Wishlist:     controllers.NewWishlistController(wishlistRepo, cfg),
		Categories:   controllers.NewCategoriesController(categoriesRepo, cfg),
		Certificates: controllers.NewCertificatesController(certificatesRepo, cfg),
		Notes:        controllers.NewNotesController(notesRepo, cfg),
		Discussions:  controllers.NewDiscussionsController(discussionsRepo, cfg),
		Users:        controllers.NewUsersController(usersRepo, cfg),
		Dashboard:    controllers.NewDashboardController(dashboardRepo, cfg),
		Updates:      controllers.NewUpdatesController(updatesRepo, cfg),
		Feedbacks:    controllers.NewFeedbacksController(feedbacksRepo, cfg),
		Coupons:      controllers.NewCouponsController(couponsSvc, couponsRepo, cfg),
		Quiz:         controllers.NewQuizController(quizSvc, quizRepo, cfg),
		Enrollments:  controllers.NewEnrollmentsController(enrollmentsRepo, cfg),
		Chapters:     controllers.NewChaptersController(chaptersRepo, cfg),
		Lessons:      controllers.NewLessonsController(lessonsRepo, cfg),
		Courses:      controllers.NewCoursesController(coursesRepo, cfg),
		Transactions: controllers.NewTransactionsController(transactionsSvc, transactionsRepo, cfg),
		Upload:       controllers.NewUploadController(cfg),
		Roles:        controllers.NewRolesController(rolesRepo, cfg),
		Profile:      controllers.NewProfileController(usersRepo, cfg),
	}
}

func (r *Router) SetUp() {
	r.App.Use(middlewares.LoggerMiddleware())
	r.App.Use(middlewares.RateLimiterMiddleware())
	r.App.Use(recover.New())
	r.App.Use(cors.New(cors.Config{
		AllowOrigins:     r.CFG.AllowedOrigins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	healthHandler := func(c *fiber.Ctx) error {
		if err := r.DB.Ping(); err != nil {
			return utils.InternalError(c, "PostgreSQL database service is down or unreachable.", err)
		}

		if err := r.Cache.Ping(c.Context()); err != nil {
			return utils.InternalError(c, "Redis cache service is down or unreachable.", err)
		}

		if err := minio.Ping(c.Context()); err != nil {
			return utils.InternalError(c, "MinIO object storage service is down or unreachable.", err)
		}

		return utils.OK(c, "All service health checks passed successfully.", fiber.Map{
			"status":  "ok",
			"version": "1.0.0",
			"services": fiber.Map{
				"postgres": "connected",
				"redis":    "connected",
				"minio":    "connected",
			},
		})
	}

	// Kept: bare, unversioned health check for infra probes (load balancer / k8s liveness)
	// that historically hit /health with no /api prefix. Remove this if that's no longer needed.
	r.App.Get("/health", healthHandler)

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

	public.Get("/health", healthHandler)

	public.Get("/categories", r.Categories.ListController)
	public.Get("/courses", r.Courses.PublicListController)
	public.Get("/courses/:slug", r.Courses.PublicSingleController)
	public.Get("/feedbacks/pinned", r.Feedbacks.ListPinnedController)
	public.Post("/transactions/webhook", r.Transactions.WebhookController)

	public.Post("/auth/login", r.Auth.LoginWithEmailController)
	public.Post("/auth/google", r.Auth.LoginWithGoogleController)

	// ============================================================
	// BLOCK 2 — AUTH MIDDLEWARE CREATED HERE. NOTHING PUBLIC BELOW THIS LINE.
	// ============================================================
	protected := r.API.Group("/v1", middlewares.BaseAuthMiddleware(r.CFG, r.Auth.Svc, r.Cache))

	// ============================================================
	// BLOCK 3 — ALL PROTECTED ROUTES.
	// ============================================================
	protected.Get("/auth/me", r.Auth.GetMeController)
	protected.Post("/auth/logout", r.Auth.LogoutController)
	protected.Post("/auth/user", middlewares.PermissionGuard(generic.AdminUsersCreate), r.Auth.CreateUserController)
	protected.Post("/auth/change-password", r.Auth.ChangePasswordController)

	protected.Get("/wishlist", middlewares.PermissionGuard(generic.UserWishlistManage), r.Wishlist.ListController)
	protected.Post("/wishlist", middlewares.PermissionGuard(generic.UserWishlistManage), r.Wishlist.CreateController)
	protected.Delete("/wishlist/:id", middlewares.PermissionGuard(generic.UserWishlistManage), r.Wishlist.DeleteController)
	protected.Delete("/wishlist", middlewares.PermissionGuard(generic.UserWishlistManage), r.Wishlist.ClearController)

	protected.Post("/categories", middlewares.PermissionGuard(generic.AdminCategoriesManage), r.Categories.CreateController)
	protected.Patch("/categories/:id", middlewares.PermissionGuard(generic.AdminCategoriesManage), r.Categories.UpdateController)
	protected.Delete("/categories/:id", middlewares.PermissionGuard(generic.AdminCategoriesManage), r.Categories.DeleteController)

	protected.Get("/certificates", middlewares.PermissionGuard(generic.UserCertificateManage), r.Certificates.ListController)
	protected.Post("/certificates/claim/course/:courseID", middlewares.PermissionGuard(generic.UserCertificateManage), r.Certificates.ClaimController)

	protected.Get("/notes", middlewares.PermissionGuard(generic.UserNotesManage), r.Notes.ReadController)
	protected.Post("/notes", middlewares.PermissionGuard(generic.UserNotesManage), r.Notes.UpsertController)
	protected.Patch("/notes/:id", middlewares.PermissionGuard(generic.UserNotesManage), r.Notes.UpdateController)
	protected.Delete("/notes/:id", middlewares.PermissionGuard(generic.UserNotesManage), r.Notes.DeleteController)

	protected.Get("/discussions/:lessonId",
		middlewares.PermissionGuard(
			generic.AdminDiscussionRead, generic.AdminDiscussionWrite, generic.AdminDiscussionDelete,
			generic.TutorDiscussionRead, generic.TutorDiscussionWrite, generic.TutorDiscussionDelete,
			generic.EnrolledDiscussionRead, generic.EnrolledDiscussionWrite,
		),
		r.Discussions.ListController,
	)
	protected.Get("/discussions/replies/:id",
		middlewares.PermissionGuard(
			generic.AdminDiscussionRead, generic.AdminDiscussionWrite, generic.AdminDiscussionDelete,
			generic.TutorDiscussionRead, generic.TutorDiscussionWrite, generic.TutorDiscussionDelete,
			generic.EnrolledDiscussionRead, generic.EnrolledDiscussionWrite,
		),
		r.Discussions.ListRepliesController,
	)
	protected.Post("/discussions",
		middlewares.PermissionGuard(
			generic.AdminDiscussionRead, generic.AdminDiscussionWrite, generic.AdminDiscussionDelete,
			generic.TutorDiscussionRead, generic.TutorDiscussionWrite, generic.TutorDiscussionDelete,
			generic.EnrolledDiscussionRead, generic.EnrolledDiscussionWrite,
		),
		r.Discussions.CreateController,
	)
	protected.Patch("/discussions/:id",
		middlewares.PermissionGuard(
			generic.AdminDiscussionRead, generic.AdminDiscussionWrite, generic.AdminDiscussionDelete,
			generic.TutorDiscussionRead, generic.TutorDiscussionWrite, generic.TutorDiscussionDelete,
			generic.EnrolledDiscussionRead, generic.EnrolledDiscussionWrite,
		),
		r.Discussions.UpdateController,
	)
	protected.Delete("/discussions/:id",
		middlewares.PermissionGuard(
			generic.AdminDiscussionRead, generic.AdminDiscussionWrite, generic.AdminDiscussionDelete,
			generic.TutorDiscussionRead, generic.TutorDiscussionWrite, generic.TutorDiscussionDelete,
			generic.EnrolledDiscussionRead, generic.EnrolledDiscussionWrite,
		),
		r.Discussions.DeleteController,
	)

	protected.Get("/users", middlewares.PermissionGuard(generic.AdminUsersList), r.Users.ListController)
	protected.Post("/users/:id/roles/assign", middlewares.PermissionGuard(generic.AdminUsersRoleAssign), r.Users.AssignRoleController)
	protected.Post("/users/:id/roles/revoke", middlewares.PermissionGuard(generic.AdminUsersRoleRevoke), r.Users.DeleteRoleController)

	protected.Get("/profile/user", middlewares.PermissionGuard(generic.UserProfile), r.Profile.ReadUserProfileController)
	protected.Post("/profile/user", middlewares.PermissionGuard(generic.UserProfile), r.Profile.UpsertUserProfileController)
	protected.Get("/profile/tutor", middlewares.PermissionGuard(generic.TutorProfile), r.Profile.ReadTutorProfileController)
	protected.Post("/profile/tutor", middlewares.PermissionGuard(generic.TutorProfile), r.Profile.UpsertTutorProfileController)
	protected.Get("/profile/admin", middlewares.PermissionGuard(generic.AdminProfile), r.Profile.AdminListProfilesController)

	protected.Get("/dashboard/user", middlewares.PermissionGuard(generic.EnrolledDashboard), r.Dashboard.UserDashboardController)
	protected.Get("/dashboard/tutor", middlewares.PermissionGuard(generic.TutorDashboard), r.Dashboard.TutorDashboardController)
	protected.Get("/dashboard/admin", middlewares.PermissionGuard(generic.AdminDashboard), r.Dashboard.AdminDashboardController)

	protected.Get("/updates/feed", middlewares.PermissionGuard(generic.EnrolledUpdatesFeed), r.Updates.FeedController)
	protected.Get("/updates", middlewares.PermissionGuard(generic.TutorUpdatesManage), r.Updates.ListController)
	protected.Post("/updates", middlewares.PermissionGuard(generic.TutorUpdatesManage), r.Updates.CreateController)
	protected.Patch("/updates/:id", middlewares.PermissionGuard(generic.TutorUpdatesManage), r.Updates.UpdateController)
	protected.Delete("/updates/:id", middlewares.PermissionGuard(generic.TutorUpdatesManage), r.Updates.DeleteController)

	protected.Post("/feedbacks", middlewares.PermissionGuard(generic.UserFeedbackCreate), r.Feedbacks.CreateController)
	protected.Get("/feedbacks", middlewares.PermissionGuard(generic.AdminFeedbackInspect, generic.TutorFeedbackManage), r.Feedbacks.ListController)
	protected.Patch("/feedbacks/:id", middlewares.PermissionGuard(generic.AdminFeedbackInspect), r.Feedbacks.UpdateController)
	protected.Delete("/feedbacks/:id", middlewares.PermissionGuard(generic.AdminFeedbackInspect, generic.TutorFeedbackManage), r.Feedbacks.DeleteController)

	protected.Get("/coupons", middlewares.PermissionGuard(generic.AdminCouponsManage), r.Coupons.ListController)
	protected.Post("/coupons", middlewares.PermissionGuard(generic.AdminCouponsManage), r.Coupons.CreateController)
	protected.Patch("/coupons/:id", middlewares.PermissionGuard(generic.AdminCouponsManage), r.Coupons.UpdateController)
	protected.Delete("/coupons/:id", middlewares.PermissionGuard(generic.AdminCouponsManage), r.Coupons.DeleteController)
	protected.Get("/coupons/check", middlewares.PermissionGuard(generic.UserTransactionsInitiate), r.Coupons.CheckController)

	protected.Post("/quiz/metadata", middlewares.PermissionGuard(generic.TutorQuizManage), r.Quiz.CreateMetadataController)
	protected.Post("/quiz/questions", middlewares.PermissionGuard(generic.TutorQuizManage), r.Quiz.CreateQuestionController)
	protected.Delete("/quiz/questions/:id", middlewares.PermissionGuard(generic.TutorQuizManage), r.Quiz.DeleteQuestionController)
	protected.Post("/quiz/question", middlewares.PermissionGuard(generic.EnrolledQuizAccess), r.Quiz.GetQuestionController)
	protected.Post("/quiz/submit", middlewares.PermissionGuard(generic.EnrolledQuizAccess), r.Quiz.CreateSubmitController)

	protected.Get("/enrollments/:course_id", middlewares.PermissionGuard(generic.UserEnrollmentsRead, generic.AdminEnrollmentsInspect), r.Enrollments.ListController)

	protected.Get("/chapters", middlewares.PermissionGuard(generic.TutorCoursesManage, generic.AdminCoursesInspect), r.Chapters.ListController)
	protected.Post("/chapters", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Chapters.CreateController)
	protected.Patch("/chapters/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Chapters.UpdateController)
	protected.Delete("/chapters/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Chapters.DeleteController)

	protected.Get("/lessons", middlewares.PermissionGuard(generic.TutorCoursesManage, generic.AdminCoursesInspect), r.Lessons.ListController)
	protected.Post("/lessons", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Lessons.CreateController)
	protected.Patch("/lessons/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Lessons.UpdateController)
	protected.Delete("/lessons/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Lessons.DeleteController)
	protected.Get("/lessons/:id/content", middlewares.PermissionGuard(generic.EnrolledCoursesStudy, generic.AdminCoursesInspect), r.Lessons.ReadContentController)
	protected.Post("/lessons/:id/complete", middlewares.PermissionGuard(generic.EnrolledCoursesStudy), r.Lessons.UpdateCompleteController)
	protected.Get("/lessons/:id/resources", middlewares.PermissionGuard(generic.EnrolledCoursesStudy, generic.AdminCoursesInspect), r.Lessons.ReadResourcesController)
	protected.Post("/lessons/:id/video", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Lessons.UpsertVideoContentController)
	protected.Post("/lessons/:id/document", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Lessons.UpsertDocumentContentController)
	protected.Post("/lessons/:id/resources", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Lessons.CreateResourceController)
	protected.Delete("/lessons/:id/resources/:resourceID", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Lessons.DeleteResourceController)

	protected.Get("/courses/:id/study", middlewares.PermissionGuard(generic.EnrolledCoursesStudy), r.Courses.StudyController)
	protected.Get("/courses/enrolled", middlewares.PermissionGuard(generic.EnrolledCoursesStudy), r.Courses.EnrolledListController)
	protected.Get("/courses/manage", middlewares.PermissionGuard(generic.TutorCoursesManage, generic.AdminCoursesInspect), r.Courses.ManageListController)
	protected.Post("/courses", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Courses.CreateController)
	protected.Patch("/courses/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Courses.UpdateController)
	protected.Delete("/courses/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), r.Courses.DeleteController)

	protected.Post("/transactions/initiate", middlewares.PermissionGuard(generic.UserTransactionsInitiate), r.Transactions.CreateController)
	protected.Get("/transactions/checkout/course/:courseId", r.Transactions.CheckoutController)
	protected.Get("/transactions/:id/status", r.Transactions.StatusController)
	protected.Get("/transactions", middlewares.PermissionGuard(generic.UserTransactionsReadOwn, generic.AdminTransactionsReadAll), r.Transactions.ListController)

	protected.Get("/upload/signed-url", r.Upload.GetSignedURLController)

	protected.Get("/roles", middlewares.PermissionGuard(generic.AdminRolesRead), r.Roles.ListRolesController)
	protected.Post("/roles", middlewares.PermissionGuard(generic.AdminRolesCreate), r.Roles.CreateRoleController)
	protected.Put("/roles/:id", middlewares.PermissionGuard(generic.AdminRolesUpdate), r.Roles.UpdateRoleController)
	protected.Delete("/roles/:id", middlewares.PermissionGuard(generic.AdminRolesDelete), r.Roles.DeleteRoleController)
	protected.Get("/roles/:id/permissions", middlewares.PermissionGuard(generic.AdminRolesRead), r.Roles.GetRolePermissionsController)
	protected.Put("/roles/:id/permissions", middlewares.PermissionGuard(generic.AdminRolesUpdate), r.Roles.SetRolePermissionsController)
	protected.Get("/permissions", middlewares.PermissionGuard(generic.AdminRolesRead), r.Roles.ListPermissionsController)
}
