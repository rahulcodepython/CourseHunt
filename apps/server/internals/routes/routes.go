package routes

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/controllers"
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

	Health       *controllers.HealthController
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
	lessonsRepo := repositories.NewLessonsRepository(db, coursesRepo, cch)
	rolesRepo := repositories.NewRolesRepository(db, cch)

	rzp := razorpay.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret, cfg.RazorpayBaseURL)
	transactionsRepo := repositories.NewTransactionsRepository(db)

	couponsSvc := services.NewCouponsService(couponsRepo)
	quizSvc := services.NewQuizService(db, quizRepo, enrollmentsRepo, coursesRepo)
	transactionsSvc := services.NewTransactionsService(transactionsRepo, cfg, rzp, couponsSvc)

	return &Router{
		App: app, API: app.Group("/api"), DB: db, CFG: cfg, Cache: cch,
		Health:       controllers.NewHealthController(db, cch, cfg),
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
		UsersRepo:    usersRepo,
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
	public.Post("/transactions/webhook", r.Transactions.WebhookController)

	// ============================================================
	// BLOCK 2 — AUTH MIDDLEWARE CREATED HERE. NOTHING PUBLIC BELOW THIS LINE.
	// ============================================================
	protected := r.API.Group("/v1", middlewares.BaseAuthMiddleware(r.CFG, r.Cache, r.UsersRepo))

	// ============================================================
	// BLOCK 3 — ALL PROTECTED ROUTES.
	// ============================================================
	protected.Get("/wishlist", middlewares.PermissionGuard("user:wishlist:manage"), r.Wishlist.ListController)
	protected.Post("/wishlist", middlewares.PermissionGuard("user:wishlist:manage"), r.Wishlist.CreateController)
	protected.Delete("/wishlist/:id", middlewares.PermissionGuard("user:wishlist:manage"), r.Wishlist.DeleteController)
	protected.Delete("/wishlist", middlewares.PermissionGuard("user:wishlist:manage"), r.Wishlist.ClearController)

	protected.Post("/categories", middlewares.PermissionGuard("admin:categories:manage"), r.Categories.CreateController)
	protected.Patch("/categories/:id", middlewares.PermissionGuard("admin:categories:manage"), r.Categories.UpdateController)
	protected.Delete("/categories/:id", middlewares.PermissionGuard("admin:categories:manage"), r.Categories.DeleteController)

	protected.Get("/certificates", middlewares.PermissionGuard("user:certificate:manage"), r.Certificates.ListController)
	protected.Post("/certificates/claim/course/:courseID", middlewares.PermissionGuard("user:certificate:manage"), r.Certificates.ClaimController)

	protected.Get("/notes", middlewares.PermissionGuard("user:notes:manage"), r.Notes.ReadController)
	protected.Post("/notes", middlewares.PermissionGuard("user:notes:manage"), r.Notes.UpsertController)
	protected.Patch("/notes/:id", middlewares.PermissionGuard("user:notes:manage"), r.Notes.UpdateController)
	protected.Delete("/notes/:id", middlewares.PermissionGuard("user:notes:manage"), r.Notes.DeleteController)

	protected.Get("/discussions/:lessonId",
		middlewares.PermissionGuard(
			"admin:discussion:read", "admin:discussion:write", "admin:discussion:delete",
			"tutor:discussion:read", "tutor:discussion:write", "tutor:discussion:delete",
			"user:discussion:read", "user:discussion:write",
		),
		r.Discussions.ListController,
	)
	protected.Get("/discussions/replies/:id",
		middlewares.PermissionGuard(
			"admin:discussion:read", "admin:discussion:write", "admin:discussion:delete",
			"tutor:discussion:read", "tutor:discussion:write", "tutor:discussion:delete",
			"user:discussion:read", "user:discussion:write",
		),
		r.Discussions.ListRepliesController,
	)
	protected.Post("/discussions",
		middlewares.PermissionGuard(
			"admin:discussion:read", "admin:discussion:write", "admin:discussion:delete",
			"tutor:discussion:read", "tutor:discussion:write", "tutor:discussion:delete",
			"user:discussion:read", "user:discussion:write",
		),
		r.Discussions.CreateController,
	)
	protected.Patch("/discussions/:id",
		middlewares.PermissionGuard(
			"admin:discussion:read", "admin:discussion:write", "admin:discussion:delete",
			"tutor:discussion:read", "tutor:discussion:write", "tutor:discussion:delete",
			"user:discussion:read", "user:discussion:write",
		),
		r.Discussions.UpdateController,
	)
	protected.Delete("/discussions/:id",
		middlewares.PermissionGuard(
			"admin:discussion:read", "admin:discussion:write", "admin:discussion:delete",
			"tutor:discussion:read", "tutor:discussion:write", "tutor:discussion:delete",
			"user:discussion:read", "user:discussion:write",
		),
		r.Discussions.DeleteController,
	)

	protected.Get("/users", middlewares.PermissionGuard("admin:users:list"), r.Users.ListController)
	protected.Post("/users/:id/roles/assign", middlewares.PermissionGuard("admin:users:role:assign"), r.Users.AssignRoleController)
	protected.Post("/users/:id/roles/revoke", middlewares.PermissionGuard("admin:users:role:revoke"), r.Users.DeleteRoleController)

	// The own-profile endpoints are identical (they read/update the caller's own
	// profile via utils.GetUserID), so any role's profile permission grants access.
	protected.Get("/profile/user", middlewares.PermissionGuard("user:profile", "admin:profile", "tutor:profile"), r.Profile.ReadUserProfileController)
	protected.Post("/profile/user", middlewares.PermissionGuard("user:profile", "admin:profile", "tutor:profile"), r.Profile.UpsertUserProfileController)
	protected.Get("/profile/tutor", middlewares.PermissionGuard("user:profile", "admin:profile", "tutor:profile"), r.Profile.ReadTutorProfileController)
	protected.Post("/profile/tutor", middlewares.PermissionGuard("user:profile", "admin:profile", "tutor:profile"), r.Profile.UpsertTutorProfileController)
	protected.Get("/profile/admin", middlewares.PermissionGuard("admin:profile"), r.Profile.AdminListProfilesController)

	protected.Get("/dashboard/user", middlewares.PermissionGuard("user:dashboard"), r.Dashboard.UserDashboardController)
	protected.Get("/dashboard/tutor", middlewares.PermissionGuard("tutor:dashboard"), r.Dashboard.TutorDashboardController)
	protected.Get("/dashboard/admin", middlewares.PermissionGuard("admin:dashboard"), r.Dashboard.AdminDashboardController)

	protected.Get("/updates/feed", middlewares.PermissionGuard("user:updates:feed"), r.Updates.FeedController)
	protected.Get("/updates", middlewares.PermissionGuard("tutor:updates:manage", "admin:updates:manage"), r.Updates.ListController)
	protected.Post("/updates", middlewares.PermissionGuard("tutor:updates:manage", "admin:updates:manage"), r.Updates.CreateController)
	protected.Patch("/updates/:id", middlewares.PermissionGuard("tutor:updates:manage", "admin:updates:manage"), r.Updates.UpdateController)
	protected.Delete("/updates/:id", middlewares.PermissionGuard("tutor:updates:manage", "admin:updates:manage"), r.Updates.DeleteController)

	protected.Post("/feedbacks", middlewares.PermissionGuard("user:feedback:create"), r.Feedbacks.CreateController)
	protected.Get("/feedbacks", middlewares.PermissionGuard("admin:feedback:inspect", "tutor:feedback:manage"), r.Feedbacks.ListController)
	protected.Patch("/feedbacks/:id", middlewares.PermissionGuard("admin:feedback:inspect"), r.Feedbacks.UpdateController)
	protected.Delete("/feedbacks/:id", middlewares.PermissionGuard("admin:feedback:inspect", "tutor:feedback:manage"), r.Feedbacks.DeleteController)

	protected.Get("/coupons", middlewares.PermissionGuard("admin:coupons:manage", "tutor:coupons:manage"), r.Coupons.ListController)
	protected.Post("/coupons", middlewares.PermissionGuard("admin:coupons:manage", "tutor:coupons:manage"), r.Coupons.CreateController)
	protected.Patch("/coupons/:id", middlewares.PermissionGuard("admin:coupons:manage", "tutor:coupons:manage"), r.Coupons.UpdateController)
	protected.Delete("/coupons/:id", middlewares.PermissionGuard("admin:coupons:manage", "tutor:coupons:manage"), r.Coupons.DeleteController)
	protected.Get("/coupons/check", middlewares.PermissionGuard("user:transactions:initiate"), r.Coupons.CheckController)

	protected.Post("/quiz/metadata", middlewares.PermissionGuard("tutor:quiz:manage"), r.Quiz.CreateMetadataController)
	protected.Post("/quiz/questions", middlewares.PermissionGuard("tutor:quiz:manage"), r.Quiz.CreateQuestionController)
	protected.Delete("/quiz/questions/:id", middlewares.PermissionGuard("tutor:quiz:manage"), r.Quiz.DeleteQuestionController)
	protected.Post("/quiz/question", middlewares.PermissionGuard("user:quiz:access"), r.Quiz.GetQuestionController)
	protected.Post("/quiz/submit", middlewares.PermissionGuard("user:quiz:access"), r.Quiz.CreateSubmitController)

	protected.Get("/enrollments", middlewares.PermissionGuard("user:enrollments:read", "admin:enrollments:inspect"), r.Enrollments.ListController)
	protected.Post("/enrollments/:userId/:courseId/revoke", middlewares.PermissionGuard("admin:revoke:course"), r.Enrollments.RevokeController)
	protected.Post("/enrollments/:userId/:courseId/regain", middlewares.PermissionGuard("admin:revoke:course"), r.Enrollments.RegainController)

	protected.Get("/chapters", middlewares.PermissionGuard("tutor:courses:manage", "admin:courses:inspect"), r.Chapters.ListController)
	protected.Post("/chapters", middlewares.PermissionGuard("tutor:courses:manage"), r.Chapters.CreateController)
	protected.Patch("/chapters/:id", middlewares.PermissionGuard("tutor:courses:manage"), r.Chapters.UpdateController)
	protected.Delete("/chapters/:id", middlewares.PermissionGuard("tutor:courses:manage"), r.Chapters.DeleteController)

	protected.Get("/lessons", middlewares.PermissionGuard("tutor:courses:manage", "admin:courses:inspect"), r.Lessons.ListController)
	protected.Post("/lessons", middlewares.PermissionGuard("tutor:courses:manage"), r.Lessons.CreateController)
	protected.Patch("/lessons/:id", middlewares.PermissionGuard("tutor:courses:manage"), r.Lessons.UpdateController)
	protected.Delete("/lessons/:id", middlewares.PermissionGuard("tutor:courses:manage"), r.Lessons.DeleteController)
	protected.Get("/lessons/:id/content", middlewares.PermissionGuard("user:courses:study", "admin:courses:inspect"), r.Lessons.ReadContentController)
	protected.Post("/lessons/:id/complete", middlewares.PermissionGuard("user:courses:study"), r.Lessons.UpdateCompleteController)
	protected.Get("/lessons/:id/resources", middlewares.PermissionGuard("user:courses:study", "admin:courses:inspect"), r.Lessons.ReadResourcesController)
	protected.Post("/lessons/:id/video", middlewares.PermissionGuard("tutor:courses:manage"), r.Lessons.UpsertVideoContentController)
	protected.Post("/lessons/:id/document", middlewares.PermissionGuard("tutor:courses:manage"), r.Lessons.UpsertDocumentContentController)
	protected.Post("/lessons/:id/resources", middlewares.PermissionGuard("tutor:courses:manage"), r.Lessons.CreateResourceController)
	protected.Delete("/lessons/:id/resources/:resourceID", middlewares.PermissionGuard("tutor:courses:manage"), r.Lessons.DeleteResourceController)

	protected.Get("/courses/:id/study", middlewares.PermissionGuard("user:courses:study"), r.Courses.StudyController)
	protected.Get("/courses/enrolled", middlewares.PermissionGuard("user:courses:study"), r.Courses.EnrolledListController)
	protected.Get("/courses/manage", middlewares.PermissionGuard("tutor:courses:manage", "admin:courses:inspect"), r.Courses.ManageListController)
	protected.Post("/courses", middlewares.PermissionGuard("tutor:courses:manage"), r.Courses.CreateController)
	protected.Patch("/courses/:id", middlewares.PermissionGuard("tutor:courses:manage"), r.Courses.UpdateController)
	protected.Delete("/courses/:id", middlewares.PermissionGuard("tutor:courses:manage"), r.Courses.DeleteController)

	protected.Post("/transactions/initiate", middlewares.PermissionGuard("user:transactions:initiate"), r.Transactions.CreateController)
	protected.Get("/transactions/checkout/course/:courseId", r.Transactions.CheckoutController)
	protected.Get("/transactions/:id/status", r.Transactions.StatusController)
	protected.Get("/transactions", middlewares.PermissionGuard("user:transactions:read_own", "admin:transactions:read_all"), r.Transactions.ListController)

	protected.Get("/upload/signed-url", r.Upload.GetSignedURLController)

	protected.Get("/roles", middlewares.PermissionGuard("admin:roles:read"), r.Roles.ListRolesController)
	protected.Post("/roles", middlewares.PermissionGuard("admin:roles:create"), r.Roles.CreateRoleController)
	protected.Put("/roles/:id", middlewares.PermissionGuard("admin:roles:update"), r.Roles.UpdateRoleController)
	protected.Delete("/roles/:id", middlewares.PermissionGuard("admin:roles:delete"), r.Roles.DeleteRoleController)
	protected.Get("/roles/:id/permissions", middlewares.PermissionGuard("admin:roles:read"), r.Roles.GetRolePermissionsController)
	protected.Put("/roles/:id/permissions", middlewares.PermissionGuard("admin:roles:update"), r.Roles.SetRolePermissionsController)
	protected.Get("/permissions", middlewares.PermissionGuard("admin:roles:read"), r.Roles.ListPermissionsController)
}
