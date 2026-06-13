package router

import (
	"coursehunt-backend/internals/config"
	v1 "coursehunt-backend/internals/handlers/v1"
	"coursehunt-backend/internals/middlewares"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type Handlers struct {
	Courses      *v1.CourseHandler
	Coupons      *v1.CouponHandler
	Users        *v1.UserHandler
	Feedback     *v1.FeedbackHandler
	Transactions *v1.TransactionHandler
	Study        *v1.StudyHandler
	Dashboard    *v1.DashboardHandler
	Storage      *v1.StorageHandler
	Updates      *v1.UpdateHandler
	Discussions  *v1.DiscussionHandler
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
		return utils.OK(c, "Ok", fiber.Map{"status": "ok", "version": "1.0.0"})
	})

	v1Group := api.Group("/v1")
	handlers := setupHandlers()

	// Route Groups
	setupPublicRoutes(v1Group, handlers)
	setupProtectedRoutes(v1Group, handlers, cfg)
}

func setupPublicRoutes(r fiber.Router, h *Handlers) {
	courses := r.Group("/public/courses")
	courses.Get("/", h.Courses.PublicCourses)
	courses.Get("/category", h.Courses.Categories)
	courses.Get("/single/:id", h.Courses.Course)

	r.Post("/public/coupons/check", h.Coupons.CheckCoupon)
}

func setupProtectedRoutes(r fiber.Router, h *Handlers, cfg *config.Config) {
	// Base protection: JWT validation and user context population
	protected := r.Group("", middlewares.BaseAuthMiddleware(cfg))

	// -------------------------------------------------------------------------
	// 1. Dashboard Routes
	// -------------------------------------------------------------------------
	dashboard := protected.Group("/dashboard")
	dashboard.Get("/admin", middlewares.RoleGuard("admin"), h.Dashboard.DashboardAdmin)
	dashboard.Get("/user", middlewares.RoleGuard("student"), h.Dashboard.DashboardUser)
	// -------------------------------------------------------------------------
	// 2. User Management (Admin & Self)
	// -------------------------------------------------------------------------
	users := protected.Group("/users")
	users.Get("/", middlewares.RoleGuard("admin"), h.Users.UsersList)
	users.Post("/:id/ban", middlewares.RoleGuard("admin"), h.Users.BanUser)
	users.Post("/:id/unban", middlewares.RoleGuard("admin"), h.Users.UnbanUser)
	users.Patch("/:id/role", middlewares.RoleGuard("admin"), h.Users.SwitchRole)
	users.Get("/edit", h.Users.CurrentUser)
	users.Patch("/edit", h.Users.UpdateUser)

	// -------------------------------------------------------------------------
	// 3. Course Management
	// -------------------------------------------------------------------------
	courses := protected.Group("/courses")
	// Student: My Courses
	courses.Get("/name", middlewares.RoleGuard("student"), h.Study.UserCourseNames)
	courses.Get("/user", middlewares.RoleGuard("student"), h.Study.UserCourses)
	// Shared: Course details (authenticated)
	courses.Get("/:id", h.Courses.Course)
	// Tutor: Creation & Basic Editing
	courses.Post("/", middlewares.RoleGuard("tutor"), h.Courses.CreateCourse)
	courses.Put("/:id", middlewares.RoleGuard("tutor"), h.Courses.UpdateCourse)
	courses.Delete("/:id", middlewares.RoleGuard("tutor"), h.Courses.DeleteCourse)
	// Tutor: Admin-style Management
	adminTutorCourses := courses.Group("/admin", middlewares.RoleGuard("tutor"))
	adminTutorCourses.Get("/", h.Courses.AdminCourses)
	adminTutorCourses.Post("/create", h.Courses.CreateCourse)
	adminTutorCourses.Get("/edit/:id", h.Courses.Course)
	adminTutorCourses.Patch("/edit/:id", h.Courses.UpdateCourse)
	adminTutorCourses.Delete("/edit/:id", h.Courses.DeleteCourse)

	// -------------------------------------------------------------------------
	// 4. Coupon Management (Admin)
	// -------------------------------------------------------------------------
	coupons := protected.Group("/coupons", middlewares.RoleGuard("admin"))
	coupons.Get("/", h.Coupons.CouponsList)
	coupons.Post("/create", h.Coupons.CreateCoupon)
	coupons.Patch("/edit/:id", h.Coupons.UpdateCoupon)
	coupons.Delete("/edit/:id", h.Coupons.DeleteCoupon)

	// -------------------------------------------------------------------------
	// 5. Feedback & Interactions
	// -------------------------------------------------------------------------
	feedback := protected.Group("/feedback")
	feedback.Get("/", middlewares.RoleGuard("admin"), h.Feedback.FeedbacksList)
	feedback.Post("/create", middlewares.RoleGuard("student"), h.Feedback.CreateFeedback)
	feedback.Patch("/:id/pin", middlewares.RoleGuard("admin"), h.Feedback.PinFeedback)
	feedback.Delete("/:id", middlewares.RoleGuard("admin"), h.Feedback.DeleteFeedback)

	// -------------------------------------------------------------------------
	// 6. Transactions & Commerce
	// -------------------------------------------------------------------------
	transactions := protected.Group("/transactions")
	transactions.Get("/admin", middlewares.RoleGuard("admin"), h.Transactions.TransactionsAdmin)
	transactions.Patch("/admin/:id/accept", middlewares.RoleGuard("admin"), h.Transactions.AcceptRefund)
	transactions.Patch("/admin/:id/reject", middlewares.RoleGuard("admin"), h.Transactions.RejectRefund)
	transactions.Patch("/:id/initiate", middlewares.RoleGuard("student"), h.Transactions.InitiateRefund)
	transactions.Get("/user", middlewares.RoleGuard("student"), h.Transactions.TransactionsUser)
	protected.Get("/checkout/:id", middlewares.RoleGuard("student"), h.Transactions.Checkout)
	protected.Post("/purchase", middlewares.RoleGuard("student"), h.Transactions.Purchase)

	// -------------------------------------------------------------------------
	// 7. Study Access
	// -------------------------------------------------------------------------
	study := protected.Group("/study", middlewares.RoleGuard("student"))
	study.Get("/:id", h.Study.StudyData)
	study.Post("/mark-read", h.Study.MarkLessonRead)
	study.Post("/set-last-viewed", h.Study.SetLastViewed)

	// -------------------------------------------------------------------------
	// 8. Media Uploads (Tutor)
	// -------------------------------------------------------------------------
	protected.Post("/upload-media", middlewares.RoleGuard("tutor"), h.Storage.UploadMedia)

	// -------------------------------------------------------------------------
	// 9. Recent Updates
	// -------------------------------------------------------------------------
	updates := protected.Group("/updates")
	updates.Get("/unseen", middlewares.RoleGuard("student"), h.Updates.UnseenUpdates)
	// Admin CRUD
	adminUpdates := updates.Group("/admin", middlewares.RoleGuard("admin"))
	adminUpdates.Get("/", h.Updates.AllUpdates)
	adminUpdates.Post("/create", h.Updates.CreateUpdate)
	adminUpdates.Patch("/edit/:id", h.Updates.UpdateUpdate)
	adminUpdates.Delete("/edit/:id", h.Updates.DeleteUpdate)
	// -------------------------------------------------------------------------
	// 10. Discussions
	// -------------------------------------------------------------------------
	discussions := protected.Group("/discussions")
	discussions.Get("/lesson/:lessonId", h.Discussions.ListByLesson)
	discussions.Post("/", h.Discussions.Create)
	discussions.Delete("/:id", middlewares.RoleGuard("tutor"), h.Discussions.Delete) // Only tutors/admins can delete
}

func setupHandlers() *Handlers {
	return &Handlers{
		Courses:      v1.NewCourseHandler(),
		Coupons:      v1.NewCouponHandler(),
		Users:        v1.NewUserHandler(),
		Feedback:     v1.NewFeedbackHandler(),
		Transactions: v1.NewTransactionHandler(),
		Study:        v1.NewStudyHandler(),
		Dashboard:    v1.NewDashboardHandler(),
		Storage:      v1.NewStorageHandler(),
		Updates:      v1.NewUpdateHandler(),
		Discussions:  v1.NewDiscussionHandler(),
	}
}
