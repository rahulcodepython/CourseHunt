package main

import (
	"context"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/jwt"
	"coursehunt/server/internals/pkg/minio"
	"coursehunt/server/internals/pkg/postgres"
	"coursehunt/server/internals/pkg/redis"
	"coursehunt/server/internals/router"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	// Load application configuration
	cfg := config.Load()

	// Connect to the database
	db := postgres.Connect(cfg)
	defer postgres.Close(db)

	// Connect to Redis
	rdb := redis.Connect(cfg)
	defer rdb.Close()

	// Connect to MinIO storage, continuing without file storage if initialization fails.
	storage, err := minio.Connect(cfg)
	if err != nil {
		slog.Warn("minio connect failed, continuing without file storage", "error", err)
	}

	// Create root context for background services like JWKS keyfunc refresh
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize JWKS JWT verifier. Auth is not optional — every protected
	// route depends on it, so a bad JWKS URL must fail the deploy here
	// rather than let the server boot and 500 on every authenticated
	// request at runtime.
	verifier, err := jwt.NewVerifier(ctx, cfg.JWKSURL)
	if err != nil {
		log.Fatalf("[main] jwks verifier init failed: %v", err)
	}

	// Create the Fiber app with production-oriented defaults.
	app := fiber.New(fiber.Config{
		AppName:               "CourseHunt API v1.0",
		ErrorHandler:          utils.ErrorHandler,
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

	// Setup router composition root
	r := router.New(app, db, rdb, storage, cfg, verifier)
	r.SetUp()

	// Gracefully stop the server on SIGINT or SIGTERM.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-quit
		slog.Info("shutting down server")
		cancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer shutdownCancel()
		if err := app.ShutdownWithContext(shutdownCtx); err != nil {
			slog.Error("shutdown error", "error", err)
		}
	}()

	addr := ":" + cfg.Port
	slog.Info("CourseHunt API listening", "addr", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("[main] listen: %v", err)
	}
}
