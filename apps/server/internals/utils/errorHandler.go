package utils

import (
	"errors"

	"github.com/gofiber/fiber/v2"
)

// ErrorHandler is the single central place every failure response is
// rendered from — handlers/services never write a status code or JSON body
// themselves; they return an *APIError (see errors.go) and this renders it
// through the standard response envelope (json, in response.go). Wired into
// fiber.Config{ErrorHandler: ...} at construction (cmd/server/main.go).
func ErrorHandler(c *fiber.Ctx, err error) error {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		return json[any](c, apiErr.Status, false, apiErr.Message, nil, apiErr.Err)
	}

	code := fiber.StatusInternalServerError
	if fe, ok := err.(*fiber.Error); ok {
		code = fe.Code
	}

	c.Locals("handler_error", err)

	if code == fiber.StatusNotFound {
		return json[any](c, fiber.StatusNotFound, false, "Requested resource not found.", nil, err)
	}

	// Anything else (a framework-level error such as a body-size limit, or a
	// recovered panic) falls back to a generic message — the raw error text
	// is logged via handler_error above but never leaked to the client.
	return json[any](c, code, false, "An unexpected error occurred.", nil, nil)
}
