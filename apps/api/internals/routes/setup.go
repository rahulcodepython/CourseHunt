package routes

import (
	"database/sql"

	"coursehunt/api/internals/config"

	"coursehunt/api/internals/modules/cart"
	"coursehunt/api/internals/modules/category"
	"coursehunt/api/internals/modules/certificate"
	"coursehunt/api/internals/modules/chapters"
	"coursehunt/api/internals/modules/coupons"
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/modules/dashboard"
	"coursehunt/api/internals/modules/discussions"
	"coursehunt/api/internals/modules/enrollments"
	"coursehunt/api/internals/modules/feedbacks"
	"coursehunt/api/internals/modules/lessons"
	"coursehunt/api/internals/modules/notes"
	"coursehunt/api/internals/modules/quiz"
	"coursehunt/api/internals/modules/transactions"
	"coursehunt/api/internals/modules/updates"
	"coursehunt/api/internals/modules/upload"
	"coursehunt/api/internals/modules/users"
	"coursehunt/api/internals/modules/wishlist"

	"github.com/jmoiron/sqlx"

	razorpaypkg "coursehunt/api/internals/pkg/razorpay"

	"coursehunt/api/internals/middlewares"
	"coursehunt/api/internals/utils"

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
	Updates      *updates.UpdatesModule
	Feedbacks    *feedbacks.FeedbacksModule
	Coupons      *coupons.CouponsModule
	Quiz         *quiz.QuizModule
	Enrollments  *enrollments.EnrollmentsModule
	Chapters     *chapters.ChaptersModule
	Lessons      *lessons.LessonsModule
	Courses      *courses.CoursesModule
	Transactions *transactions.TransactionsModule
	Upload       *upload.UploadModule
}

func NewRouter(app *fiber.App, db *sql.DB, cfg *config.Config) *Router {
	// Independent modules (no cross-deps)
	enrollments := enrollments.NewEnrollmentsModule(sqlx.NewDb(db, "postgres"))
	courses := courses.NewCoursesModule(sqlx.NewDb(db, "postgres"), enrollments)

	cart := cart.NewCartModule(sqlx.NewDb(db, "postgres"))
	wishlist := wishlist.NewWishlistModule(sqlx.NewDb(db, "postgres"))
	categories := category.NewCategoryModule(sqlx.NewDb(db, "postgres"))
	certificates := certificate.NewCertificateModule(sqlx.NewDb(db, "postgres"), enrollments)
	sqlxDB := sqlx.NewDb(db, "postgres")
	dashboard := dashboard.NewDashboardModule(sqlxDB)
	notes := notes.NewNotesModule(sqlxDB, enrollments)
	discussions := discussions.NewDiscussionsModule(sqlxDB, enrollments, courses)
	users := users.NewUsersModule(sqlxDB)
	updates := updates.NewUpdatesModule(sqlxDB)
	feedbacks := feedbacks.NewFeedbacksModule(sqlxDB, enrollments, courses)
	coupons := coupons.NewCouponsModule(sqlx.NewDb(db, "postgres"), courses)
	quiz := quiz.NewQuizModule(sqlxDB, enrollments, courses)
	chapters := chapters.NewChaptersModule(sqlx.NewDb(db, "postgres"), courses)
	lessons := lessons.NewLessonsModule(sqlxDB, courses)
	uploadMod := upload.NewUploadModule(sqlxDB)

	// Modules with cross-deps — order matters, clearly visible
	rzp := razorpaypkg.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret, cfg.RazorpayBaseURL)
	transactions := transactions.NewTransactionsModule(sqlxDB, coupons, courses, enrollments, rzp, cfg)

	return &Router{
		App: app, API: app.Group("/api"), DB: db, CFG: cfg,
		Cart: cart, Wishlist: wishlist, Categories: categories,
		Certificates: certificates, Notes: notes, Discussions: discussions,
		Users: users, Dashboard: dashboard,
		Updates: updates, Feedbacks: feedbacks, Coupons: coupons,
		Quiz: quiz, Enrollments: enrollments, Chapters: chapters,
		Lessons: lessons, Courses: courses, Transactions: transactions,
		Upload: uploadMod,
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

	v1 := r.API.Group("/v1")
	protected := v1.Group("", middlewares.BaseAuthMiddleware(r.CFG))

	v1.Get("/health", func(c *fiber.Ctx) error {
		return utils.OK(c, "Health check passed.", fiber.Map{"status": "ok", "version": "1.0.0", "database": r.DB.Ping()})
	})

	// Register Routes
	r.Cart.Routes(v1, protected)
	r.Wishlist.Routes(v1, protected)
	r.Categories.Routes(v1, protected)
	r.Certificates.Routes(v1, protected)
	r.Notes.Routes(v1, protected)
	r.Discussions.Routes(v1, protected)
	r.Users.Routes(v1, protected)
	r.Dashboard.Routes(v1, protected)
	r.Updates.Routes(v1, protected)
	r.Feedbacks.Routes(v1, protected)
	r.Coupons.Routes(v1, protected)
	r.Quiz.Routes(v1, protected)
	r.Enrollments.Routes(v1, protected)
	r.Chapters.Routes(v1, protected)
	r.Lessons.Routes(v1, protected)
	r.Courses.Routes(v1, protected)
	r.Transactions.Routes(v1, protected)
	r.Upload.Routes(v1, protected)
}
