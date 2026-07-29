package utils

import (
	gojson "encoding/json"

	"github.com/gofiber/fiber/v2"
)

func ServeScalarDocs(app *fiber.App) {
	spec := minimalSpec()

	app.Get("/docs/openapi.json", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "application/json")
		return c.SendString(spec)
	})

	app.Get("/docs", func(c *fiber.Ctx) error {
		html := `<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CourseHunt API - Scalar Docs</title><style>body{margin:0}</style></head><body><script id="api-reference" data-url="/docs/openapi.json" type="application/json"></script><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></body></html>`
		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendString(html)
	})
}

func minimalSpec() string {
	spec := map[string]any{
		"openapi": "3.1.0",
		"info": map[string]any{
			"title":       "CourseHunt API",
			"version":     "1.0.0",
			"description": "CourseHunt backend API server.",
		},
		"servers": []map[string]any{
			{"url": "http://localhost:8080", "description": "Local development"},
		},
		"paths": map[string]any{},
	}
	b, _ := gojson.MarshalIndent(spec, "", "  ")
	return string(b)
}
