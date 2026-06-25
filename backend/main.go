package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/routes"

	"coursehunt-backend/internals/storage"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func main() {
	// Load application configuration
	cfg := config.Load()

	// Connect to the database
	db := database.Connect(cfg)

	// Ensure it closes on application exit
	defer database.Close(db)

	// Initialize MinIO storage, continuing without file storage if initialization fails.
	err := storage.SetupMinio(cfg)
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

	// Setup router
	router := routes.NewRouter(app, db, cfg)
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
