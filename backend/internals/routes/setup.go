package routes

import (
	"database/sql"

	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/modules/cart"
	"coursehunt-backend/internals/modules/category"
	"coursehunt-backend/internals/modules/certificate"
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

type Router struct {
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

func NewRouter(app *fiber.App, db *sql.DB, cfg *config.Config) *Router {
	// Independent modules (no cross-deps)
	enrollments := enrollments.NewEnrollmentsModule(db)
	courses := courses.NewCoursesModule(db, enrollments)

	cart := cart.NewCartModule(db)
	wishlist := wishlist.NewWishlistModule(db)
	categories := category.NewCategoryModule(db)
	certificates := certificate.NewCertificateModule(db, enrollments)
	notes := notes.NewNotesModule(db, enrollments)
	discussions := discussions.NewDiscussionsModule(db, enrollments, courses)
	users := users.NewUsersModule(db)
	dashboard := dashboard.NewDashboardModule(db)
	profile := profile.NewProfileModule(db)
	updates := updates.NewUpdatesModule(db)
	feedbacks := feedbacks.NewFeedbacksModule(db, enrollments, courses)
	coupons := coupons.NewCouponsModule(db)
	quiz := quiz.NewQuizModule(db, enrollments, courses)
	chapters := chapters.NewChaptersModule(db, courses)
	lessons := lessons.NewLessonsModule(db, courses)

	// Modules with cross-deps — order matters, clearly visible
	rzp := razorpaypkg.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret)
	transactions := transactions.NewTransactionsModule(db, coupons, courses, enrollments, rzp, cfg)

	return &Router{
		App: app, API: app.Group("/api"), DB: db, CFG: cfg,
		Cart: cart, Wishlist: wishlist, Categories: categories,
		Certificates: certificates, Notes: notes, Discussions: discussions,
		Users: users, Dashboard: dashboard, Profile: profile,
		Updates: updates, Feedbacks: feedbacks, Coupons: coupons,
		Quiz: quiz, Enrollments: enrollments, Chapters: chapters,
		Lessons: lessons, Courses: courses, Transactions: transactions,
	}
}

func (r *Router) SetUp() {
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
