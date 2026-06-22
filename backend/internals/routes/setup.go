package routes

import (
	"database/sql"

	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/modules/cart"
	category "coursehunt-backend/internals/modules/category"
	certificate "coursehunt-backend/internals/modules/certificate"
	"coursehunt-backend/internals/modules/chapters"
	"coursehunt-backend/internals/modules/coupons"
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/dashboard"
	"coursehunt-backend/internals/modules/discussions"
	"coursehunt-backend/internals/modules/enrollments"
	"coursehunt-backend/internals/modules/feedbacks"
	"coursehunt-backend/internals/modules/lessons"
	"coursehunt-backend/internals/modules/notes"
	"coursehunt-backend/internals/modules/profile"
	"coursehunt-backend/internals/modules/quiz"
	"coursehunt-backend/internals/modules/transactions"
	"coursehunt-backend/internals/modules/updates"
	"coursehunt-backend/internals/modules/users"
	"coursehunt-backend/internals/modules/wishlist"

	razorpaypkg "coursehunt-backend/internals/pkg/razorpay"

	"coursehunt-backend/internals/middlewares"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type AppRouter struct {
	App *fiber.App
	API fiber.Router
	DB  *sql.DB
	CFG *config.Config

	Cart         *cart.CartModule
	Wishlist     *wishlist.WishlistModule
	Categories   *category.CategoryModule
	Certificates *certificate.CertificateModule
	Notes        *notes.NotesModule
	Discussions  *discussions.DiscussionsModule
	Users        *users.UsersModule
	Dashboard    *dashboard.DashboardModule
	Profile      *profile.ProfileModule
	Updates      *updates.UpdatesModule
	Feedbacks    *feedbacks.FeedbacksModule
	Coupons      *coupons.CouponsModule
	Quiz         *quiz.QuizModule
	Enrollments  *enrollments.EnrollmentsModule
	Chapters     *chapters.ChaptersModule
	Lessons      *lessons.LessonsModule
	Courses      *courses.CoursesModule
	Transactions *transactions.TransactionsModule
}

func NewAppRouter(app *fiber.App, db *sql.DB, cfg *config.Config) *AppRouter {
	cartMod := cart.NewCartModule(db)
	wishlistMod := wishlist.NewWishlistModule(db)
	categoriesMod := category.NewCategoryModule(db)
	certificatesMod := certificate.NewCertificateModule(db)
	notesMod := notes.NewNotesModule(db)
	discussionsMod := discussions.NewDiscussionsModule(db)
	usersMod := users.NewUsersModule(db)
	dashboardMod := dashboard.NewDashboardModule(db)
	profileMod := profile.NewProfileModule(db)

	updatesMod := updates.NewUpdatesModule(db)
	feedbacksMod := feedbacks.NewFeedbacksModule(db)
	couponsMod := coupons.NewCouponsModule(db)
	quizMod := quiz.NewQuizModule(db)
	enrollmentsMod := enrollments.NewEnrollmentsModule(db)
	chaptersMod := chapters.NewChaptersModule(db)
	lessonsMod := lessons.NewLessonsModule(db, enrollmentsMod, notesMod, quizMod)
	coursesMod := courses.NewCoursesModule(db, chaptersMod, lessonsMod, enrollmentsMod)

	rzp := razorpaypkg.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret)
	transactionsMod := transactions.NewTransactionsModule(db, couponsMod, coursesMod, enrollmentsMod, rzp)

	return &AppRouter{
		App: app,
		API: app.Group("/api"),
		DB:  db,
		CFG: cfg,

		Cart:         cartMod,
		Wishlist:     wishlistMod,
		Categories:   categoriesMod,
		Certificates: certificatesMod,
		Notes:        notesMod,
		Discussions:  discussionsMod,
		Users:        usersMod,
		Dashboard:    dashboardMod,
		Profile:      profileMod,
		Updates:      updatesMod,
		Feedbacks:    feedbacksMod,
		Coupons:      couponsMod,
		Quiz:         quizMod,
		Enrollments:  enrollmentsMod,
		Chapters:     chaptersMod,
		Lessons:      lessonsMod,
		Courses:      coursesMod,
		Transactions: transactionsMod,
	}
}

func (r *AppRouter) SetUp() {
	// Global Middlewares
	r.App.Use(middlewares.LoggerMiddleware())
	r.App.Use(middlewares.RateLimiterMiddleware())
	r.App.Use(recover.New())
	r.App.Use(cors.New(cors.Config{
		AllowOrigins:     r.CFG.AllowedOrigins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	r.API.Get("/health", func(c *fiber.Ctx) error {
		return utils.JSON(c, 200, true, "OK", fiber.Map{"status": "ok", "version": "1.0.0", "database": r.DB.Ping()}, nil)
	})

	v1 := r.API.Group("/v1")
	protected := v1.Group("", middlewares.BaseAuthMiddleware(r.CFG))

	// Register Routes
	r.Cart.Routes(protected)
	r.Wishlist.Routes(protected)
	r.Categories.Routes(v1, protected)
	r.Certificates.Routes(protected)
	r.Notes.Routes(protected)
	r.Discussions.Routes(protected)
	r.Users.Routes(protected)
	r.Dashboard.Routes(protected)
	r.Profile.Routes(protected)
	r.Updates.Routes(v1, protected)
	r.Feedbacks.Routes(v1, protected)
	r.Coupons.Routes(protected)
	r.Quiz.Routes(protected)
	r.Enrollments.Routes(protected)
	r.Chapters.Routes(protected)
	r.Lessons.Routes(protected)
	r.Courses.Routes(v1, protected)
	r.Transactions.Routes(v1, protected)
}
