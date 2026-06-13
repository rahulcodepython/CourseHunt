package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/router"
	"coursehunt-backend/internals/storage"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func main() {
	// Load application configuration from the environment.
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("[main] config: %v", err)
	}

	// Connect to PostgreSQL and close the pool during shutdown.
	database.ConnectDB()

	// Close the database connection when the program exits.
	defer database.Close()

	// Apply SQL migrations before serving requests.
	if err := database.RunMigrations(); err != nil {
		log.Fatalf("[main] migrations: %v", err)
	}

	// Connect to MinIO; the API can still run if file storage is temporarily down.
	err = storage.SetupMinio()
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
	router.Setup(app)

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
