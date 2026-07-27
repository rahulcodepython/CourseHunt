package routes

import (
	"coursehunt/api/internals/config"
	"coursehunt/api/internals/middlewares"

	"coursehunt/api/internals/pkg/cache"

	"coursehunt/api/internals/modules/auth"
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
	"coursehunt/api/internals/modules/roles"
	"coursehunt/api/internals/modules/transactions"
	"coursehunt/api/internals/modules/updates"
	"coursehunt/api/internals/modules/upload"
	"coursehunt/api/internals/modules/users"
	"coursehunt/api/internals/modules/wishlist"

	razorpaypkg "coursehunt/api/internals/pkg/razorpay"

	"coursehunt/api/internals/utils"

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

	Auth         *auth.AuthModule
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
	Roles        *roles.RolesModule
}

func NewRouter(app *fiber.App, db *sqlx.DB, rdb *redis.Client, cfg *config.Config) *Router {
	cache := cache.NewCache(rdb)

	enrollments := enrollments.NewEnrollmentsModule(db)
	courses := courses.NewCoursesModule(db, enrollments, cache)

	authMod := auth.NewAuthModule(db, cfg)
	wishlist := wishlist.NewWishlistModule(db, cache)
	categories := category.NewCategoryModule(db, cache)
	certificates := certificate.NewCertificateModule(db, enrollments)
	dashboard := dashboard.NewDashboardModule(db)
	notes := notes.NewNotesModule(db, enrollments, cache)
	discussions := discussions.NewDiscussionsModule(db, enrollments, courses)
	users := users.NewUsersModule(db)
	updates := updates.NewUpdatesModule(db, cache)
	feedbacks := feedbacks.NewFeedbacksModule(db, enrollments, courses, cache)
	coupons := coupons.NewCouponsModule(db, courses, cache)
	quiz := quiz.NewQuizModule(db, enrollments, courses, cache)
	chapters := chapters.NewChaptersModule(db, courses, cache)
	lessons := lessons.NewLessonsModule(db, courses, cache)
	uploadMod := upload.NewUploadModule(db)
	rolesMod := roles.NewRolesModule(db, cache)

	rzp := razorpaypkg.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret, cfg.RazorpayBaseURL)
	transactions := transactions.NewTransactionsModule(db, coupons, courses, enrollments, rzp, cfg)

	return &Router{
		App: app, API: app.Group("/api"), DB: db, CFG: cfg, Cache: cache,
		Auth: authMod, Wishlist: wishlist, Categories: categories,
		Certificates: certificates, Notes: notes, Discussions: discussions,
		Users: users, Dashboard: dashboard,
		Updates: updates, Feedbacks: feedbacks, Coupons: coupons,
		Quiz: quiz, Enrollments: enrollments, Chapters: chapters,
		Lessons: lessons, Courses: courses, Transactions: transactions,
		Upload: uploadMod,
		Roles:  rolesMod,
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

	v1 := r.API.Group("/v1")
	protected := v1.Group("", middlewares.BaseAuthMiddleware(r.CFG))

	v1.Get("/health", func(c *fiber.Ctx) error {
		return utils.OK(c, "Health check passed.", fiber.Map{"status": "ok", "version": "1.0.0", "database": r.DB.Ping()})
	})

	r.Auth.Routes(v1, protected)
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
	r.Roles.Routes(v1, protected)
}
