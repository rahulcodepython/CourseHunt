package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/database"
	"coursehunt/server/internals/routes"

	"coursehunt/server/internals/pkg/minio"
	"coursehunt/server/internals/pkg/redis"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func main() {
	// Load application configuration
	cfg := config.Load()

	// Connect to the database
	db := database.Connect(cfg)
	defer database.Close(db)

	// Connect to Redis
	rdb := redis.Connect(cfg)
	defer rdb.Close()

	// Initialize MinIO storage, continuing without file storage if initialization fails.
	err := minio.SetupMinio(cfg)
	if err != nil {
		log.Printf("[main] minio connect warning: %v (continuing without file storage)", err)
	}

	// Create the Fiber app with production-oriented defaults.
	app := fiber.New(fiber.Config{
		AppName:               "CourseHunt API v1.0",
		ErrorHandler:          utils.GlobalErrorHandler,
		BodyLimit:             1 * 1024 * 1024,
		DisableStartupMessage: false,
		// fasthttp's default 4096-byte read buffer covers the request line
		// plus ALL headers combined. Our Authorization header alone carries
		// a JWT with the caller's full roles/permissions array embedded —
		// an admin holding every admin:* permission already produces a
		// ~1.3KB token, and Chrome's own default headers (sec-ch-ua-*,
		// Accept, cookies, etc.) add several hundred more on top. Once that
		// combined total exceeded the buffer, fasthttp didn't return a
		// clean 431 — it just closed the connection, which every browser
		// surfaces as an opaque "Failed to fetch"/network error with zero
		// indication of the real cause. More permissions == a bigger JWT ==
		// this getting worse over time, so headroom needs to be generous,
		// not just bumped to whatever happens to work today.
		ReadBufferSize: 16 * 1024,
	})

	// Scalar API docs
	utils.ServeScalarDocs(app)

	// Setup router
	router := routes.NewRouter(app, db, rdb, cfg)
	router.SetUp()

	// Gracefully stop the server on SIGINT or SIGTERM.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-quit
		log.Println("[main] Shutting down server...")
		if err := app.Shutdown(); err != nil {
			log.Printf("[main] shutdown: %v", err)
		}
	}()

	addr := ":" + cfg.Port
	log.Printf("[main] CourseHunt API listening on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("[main] listen: %v", err)
	}
}
