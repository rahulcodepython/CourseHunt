package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"coursehunt/api/internals/config"
	"coursehunt/api/internals/database"
	"coursehunt/api/internals/routes"

	"coursehunt/api/internals/pkg/minio"
	"coursehunt/api/internals/pkg/redis"
	"coursehunt/api/internals/utils"

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
		BodyLimit:             100 * 1024 * 1024,
		DisableStartupMessage: false,
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
