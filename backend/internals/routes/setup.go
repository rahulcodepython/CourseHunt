package routes

import (
	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type AppHandlers struct {
	Courses      *handlers.CourseHandler
	Chapters     *handlers.ChapterHandler
	Lessons      *handlers.LessonHandler
	Quiz         *handlers.QuizHandler
	Discussions  *handlers.DiscussionHandler
	Notes        *handlers.NoteHandler
	Updates      *handlers.UpdateHandler
	Coupons      *handlers.CouponHandler
	Transactions *handlers.TransactionHandler
	Feedbacks    *handlers.FeedbackHandler
	Users        *handlers.UserHandler
	Dashboard    *handlers.DashboardHandler
	Categories   *handlers.CategoryHandler
	Enrollments  *handlers.EnrollmentHandler
	Wishlist     *handlers.WishlistHandler
	Cart         *handlers.CartHandler
	Certificates *handlers.CertificateHandler
	Profile      *handlers.ProfileHandler
}

func Setup(app *fiber.App) {
	cfg := config.CFG

	// Global Middlewares
	app.Use(middlewares.LoggerMiddleware())
	app.Use(middlewares.RateLimiterMiddleware())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return utils.JSON(c, 200, true, "OK", fiber.Map{"status": "ok", "version": "1.0.0"}, nil)
	})

	h := &AppHandlers{
		Courses:      handlers.NewCourseHandler(),
		Chapters:     handlers.NewChapterHandler(),
		Lessons:      handlers.NewLessonHandler(),
		Quiz:         handlers.NewQuizHandler(),
		Discussions:  handlers.NewDiscussionHandler(),
		Notes:        handlers.NewNoteHandler(),
		Updates:      handlers.NewUpdateHandler(),
		Coupons:      handlers.NewCouponHandler(),
		Transactions: handlers.NewTransactionHandler(),
		Feedbacks:    handlers.NewFeedbackHandler(),
		Users:        handlers.NewUserHandler(),
		Dashboard:    handlers.NewDashboardHandler(),
		Categories:   handlers.NewCategoryHandler(),
		Enrollments:  handlers.NewEnrollmentHandler(),
		Wishlist:     handlers.NewWishlistHandler(),
		Cart:         handlers.NewCartHandler(),
		Certificates: handlers.NewCertificateHandler(),
		Profile:      handlers.NewProfileHandler(),
	}

	v1 := api.Group("/v1")
	protected := v1.Group("", middlewares.BaseAuthMiddleware(cfg))

	// Register Routes
	SetupCoursesRoutes(v1, protected, h.Courses)
	SetupChaptersRoutes(protected, h.Chapters)
	SetupLessonsRoutes(protected, h.Lessons)
	SetupQuizRoutes(protected, h.Quiz)
	SetupDiscussionsRoutes(protected, h.Discussions)
	SetupNotesRoutes(protected, h.Notes)
	SetupUpdatesRoutes(v1, protected, h.Updates)
	SetupCouponsRoutes(protected, h.Coupons)
	SetupTransactionsRoutes(v1, protected, h.Transactions)
	SetupFeedbacksRoutes(v1, protected, h.Feedbacks)
	SetupUsersRoutes(protected, h.Users)
	SetupDashboardRoutes(protected, h.Dashboard)
	SetupCategoriesRoutes(v1, protected, h.Categories)
	SetupEnrollmentsRoutes(protected, h.Enrollments)
	SetupWishlistRoutes(protected, h.Wishlist)
	SetupCartRoutes(protected, h.Cart)
	SetupCertificatesRoutes(protected, h.Certificates)
	SetupProfileRoutes(protected, h.Profile)
}
