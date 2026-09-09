package middlewares_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func TestRequestContextMiddleware_Timeout(t *testing.T) {
	app := fiber.New(fiber.Config{
		ErrorHandler: utils.ErrorHandler,
	})

	rootCtx := context.Background()
	app.Use(middlewares.RequestContextMiddleware(rootCtx, 50*time.Millisecond))

	app.Get("/slow", func(c *fiber.Ctx) error {
		ctx := c.UserContext()
		select {
		case <-time.After(200 * time.Millisecond):
			return c.SendString("ok")
		case <-ctx.Done():
			return ctx.Err()
		}
	})

	req := httptest.NewRequest(http.MethodGet, "/slow", nil)
	resp, err := app.Test(req, 1000)
	if err != nil {
		t.Fatalf("unexpected error running test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusGatewayTimeout {
		t.Errorf("expected status 504 Gateway Timeout, got %d", resp.StatusCode)
	}
}

func TestRequestContextMiddleware_ServerShutdownCancellation(t *testing.T) {
	app := fiber.New(fiber.Config{
		ErrorHandler: utils.ErrorHandler,
	})

	rootCtx, rootCancel := context.WithCancel(context.Background())
	app.Use(middlewares.RequestContextMiddleware(rootCtx, 10*time.Second))

	app.Get("/shutdown", func(c *fiber.Ctx) error {
		ctx := c.UserContext()
		rootCancel()

		select {
		case <-time.After(500 * time.Millisecond):
			return c.SendString("ok")
		case <-ctx.Done():
			return ctx.Err()
		}
	})

	req := httptest.NewRequest(http.MethodGet, "/shutdown", nil)
	resp, err := app.Test(req, 1000)
	if err != nil {
		t.Fatalf("unexpected error running test request: %v", err)
	}

	if resp.StatusCode != 499 {
		t.Errorf("expected status 499 Client Closed/Canceled, got %d", resp.StatusCode)
	}
}

func TestRequestContextMiddleware_NormalSuccess(t *testing.T) {
	app := fiber.New(fiber.Config{
		ErrorHandler: utils.ErrorHandler,
	})

	rootCtx := context.Background()
	app.Use(middlewares.RequestContextMiddleware(rootCtx, 2*time.Second))

	app.Get("/fast", func(c *fiber.Ctx) error {
		ctx := c.UserContext()
		if ctx == nil {
			t.Error("expected non-nil UserContext")
		}
		return c.SendString("success")
	})

	req := httptest.NewRequest(http.MethodGet, "/fast", nil)
	resp, err := app.Test(req, 1000)
	if err != nil {
		t.Fatalf("unexpected error running test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}
}
