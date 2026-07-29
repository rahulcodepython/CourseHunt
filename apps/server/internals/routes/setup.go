package routes

import (
	"coursehunt/api/internals/config"
	"coursehunt/api/internals/middlewares"

	"coursehunt/api/internals/pkg/cache"
	"coursehunt/api/internals/pkg/minio"

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

	public := r.API.Group("/api/v1")

	public.Get("/api/v1/health", healthHandler)

	protected := r.API.Group("/api/v1", middlewares.BaseAuthMiddleware(r.CFG))

	r.Auth.Routes(public, protected)
	r.Wishlist.Routes(public, protected)
	r.Categories.Routes(public, protected)
	r.Certificates.Routes(public, protected)
	r.Notes.Routes(public, protected)
	r.Discussions.Routes(public, protected)
	r.Users.Routes(public, protected)
	r.Dashboard.Routes(public, protected)
	r.Updates.Routes(public, protected)
	r.Feedbacks.Routes(public, protected)
	r.Coupons.Routes(public, protected)
	r.Quiz.Routes(public, protected)
	r.Enrollments.Routes(public, protected)
	r.Chapters.Routes(public, protected)
	r.Lessons.Routes(public, protected)
	r.Courses.Routes(public, protected)
	r.Transactions.Routes(public, protected)
	r.Upload.Routes(public, protected)
	r.Roles.Routes(public, protected)
}
