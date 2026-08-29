package router

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/features/categories"
	"coursehunt/server/internals/features/certificates"
	"coursehunt/server/internals/features/chapters"
	"coursehunt/server/internals/features/coupons"
	"coursehunt/server/internals/features/courses"
	"coursehunt/server/internals/features/dashboard"
	"coursehunt/server/internals/features/discussions"
	"coursehunt/server/internals/features/enrollments"
	"coursehunt/server/internals/features/faqs"
	"coursehunt/server/internals/features/feedbacks"
	"coursehunt/server/internals/features/lessons"
	"coursehunt/server/internals/features/logs"
	"coursehunt/server/internals/features/monitoring"
	"coursehunt/server/internals/features/notes"
	"coursehunt/server/internals/features/notifications"
	"coursehunt/server/internals/features/quiz"
	"coursehunt/server/internals/features/roles"
	"coursehunt/server/internals/features/security"
	"coursehunt/server/internals/features/transactions"
	"coursehunt/server/internals/features/updates"
	"coursehunt/server/internals/features/upload"
	"coursehunt/server/internals/features/users"
	"coursehunt/server/internals/features/wishlist"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/minio"
	"coursehunt/server/internals/pkg/razorpay"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Router struct {
	App   *fiber.App
	API   fiber.Router
	DB    *pgxpool.Pool
	CFG   *config.Config
	Cache *cache.Cache

	Categories    *categories.App
	Certificates  *certificates.App
	Chapters      *chapters.App
	Coupons       *coupons.App
	Courses       *courses.App
	Dashboard     *dashboard.App
	Discussions   *discussions.App
	Enrollments   *enrollments.App
	Faqs          *faqs.App
	Feedbacks     *feedbacks.App
	Lessons       *lessons.App
	Logs          *logs.App
	Monitoring    *monitoring.App
	Notes         *notes.App
	Notifications *notifications.App
	Quiz          *quiz.App
	Roles         *roles.App
	Security      *security.App
	Transactions  *transactions.App
	Updates       *updates.App
	Upload        *upload.App
	Users         *users.App
	Wishlist      *wishlist.App
}

func New(app *fiber.App, db *pgxpool.Pool, rdb *redis.Client, storage *minio.Storage, cfg *config.Config) *Router {
	cch := cache.NewCache(rdb)

	rzp := razorpay.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret, cfg.RazorpayBaseURL)

	// Construct feature apps in dependency order
	categoriesApp := categories.New(db, cch, cfg)
	certificatesApp := certificates.New(db, cfg)
	chaptersApp := chapters.New(db, cch, cfg)
	couponsApp := coupons.New(db, cch, cfg)
	coursesApp := courses.New(db, cch, cfg, storage)
	dashboardApp := dashboard.New(db, cfg)
	discussionsApp := discussions.New(db, cfg)
	enrollmentsApp := enrollments.New(db, cfg)
	faqsApp := faqs.New(db, cch, cfg)
	feedbacksApp := feedbacks.New(db, cch, cfg)
	lessonsApp := lessons.New(db, cch, cfg, storage)
	logsApp := logs.New(db, cfg)
	monitoringApp := monitoring.New(db, cch, cfg, storage)
	notesApp := notes.New(db, cch, cfg)
	notificationsApp := notifications.New(db, cfg)
	quizApp := quiz.New(db, cch, cfg)
	rolesApp := roles.New(db, cch, cfg)
	securityApp := security.New(db, cfg)
	transactionsApp := transactions.New(db, cfg, rzp, enrollmentsApp, couponsApp)
	updatesApp := updates.New(db, cch, cfg)
	uploadApp := upload.New(cfg, storage)
	usersApp := users.New(db, cch, cfg)
	wishlistApp := wishlist.New(db, cch, cfg)

	return &Router{
		App:           app,
		API:           app.Group("/api"),
		DB:            db,
		CFG:           cfg,
		Cache:         cch,
		Categories:    categoriesApp,
		Certificates:  certificatesApp,
		Chapters:      chaptersApp,
		Coupons:       couponsApp,
		Courses:       coursesApp,
		Dashboard:     dashboardApp,
		Discussions:   discussionsApp,
		Enrollments:   enrollmentsApp,
		Faqs:          faqsApp,
		Feedbacks:     feedbacksApp,
		Lessons:       lessonsApp,
		Logs:          logsApp,
		Monitoring:    monitoringApp,
		Notes:         notesApp,
		Notifications: notificationsApp,
		Quiz:          quizApp,
		Roles:         rolesApp,
		Security:      securityApp,
		Transactions:  transactionsApp,
		Updates:       updatesApp,
		Upload:        uploadApp,
		Users:         usersApp,
		Wishlist:      wishlistApp,
	}
}

func (r *Router) SetUp() {
	r.App.Use(middlewares.LoggerMiddleware(r.DB))
	r.App.Use(recover.New())
	r.App.Use(helmet.New())
	r.App.Use(compress.New())
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

	auth := middlewares.BaseAuthMiddleware(r.CFG, r.Cache, r.Users)

	r.Categories.RegisterRoutes(r.API, auth)
	r.Certificates.RegisterRoutes(r.API, auth)
	r.Chapters.RegisterRoutes(r.API, auth)
	r.Coupons.RegisterRoutes(r.API, auth)
	r.Courses.RegisterRoutes(r.API, auth)
	r.Dashboard.RegisterRoutes(r.API, auth)
	r.Discussions.RegisterRoutes(r.API, auth)
	r.Enrollments.RegisterRoutes(r.API, auth)
	r.Faqs.RegisterRoutes(r.API, auth)
	r.Feedbacks.RegisterRoutes(r.API, auth)
	r.Lessons.RegisterRoutes(r.API, auth)
	r.Logs.RegisterRoutes(r.API, auth)
	r.Monitoring.RegisterRoutes(r.API, auth)
	r.Notes.RegisterRoutes(r.API, auth)
	r.Notifications.RegisterRoutes(r.API, auth)
	r.Quiz.RegisterRoutes(r.API, auth)
	r.Roles.RegisterRoutes(r.API, auth)
	r.Security.RegisterRoutes(r.API, auth)
	r.Transactions.RegisterRoutes(r.API, auth)
	r.Updates.RegisterRoutes(r.API, auth)
	r.Upload.RegisterRoutes(r.API, auth)
	r.Users.RegisterRoutes(r.API, auth)
	r.Wishlist.RegisterRoutes(r.API, auth)
}
