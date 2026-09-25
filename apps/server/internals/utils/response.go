package utils

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"

	"github.com/gofiber/fiber/v2"
)

// json is the canonical response envelope used by every handler (success,
// via OK/Created below) and by the central ErrorHandler for every failure.
// It is the single place the wire response schema is defined.
func json[T interface{}](c *fiber.Ctx, status int, success bool, message string, data T, err error) error {
	var errStr string
	if err != nil {
		errStr = err.Error()
		c.Locals("handler_error", err)
	}
	if status >= 400 {
		c.Locals("handler_error_msg", message)
	}
	body := generic.Response[T]{
		Success: success,
		Message: message,
		Data:    data,
		Error:   errStr,
	}
	return c.Status(status).JSON(body)
}

// OK returns a successful HTTP 200 response with payload data.
func OK[T interface{}](c *fiber.Ctx, message string, data T) error {
	return json(c, fiber.StatusOK, true, message, data, nil)
}

// OKEmpty returns a successful HTTP 200 response with nil payload.
func OKEmpty(c *fiber.Ctx, message string) error {
	return json[*struct{}](c, fiber.StatusOK, true, message, nil, nil)
}

// Created returns a successful HTTP 201 response with payload data.
func Created[T interface{}](c *fiber.Ctx, message string, data T) error {
	return json(c, fiber.StatusCreated, true, message, data, nil)
}

// APIError is the single canonical error type returned across all handlers and services.
// It constructs an error envelope with status code and context for the central ErrorHandler.
type APIError struct {
	Status  int
	Message string
	Data    interface{}
	Err     error
}

func (e *APIError) Error() string { return e.Message }
func (e *APIError) Unwrap() error { return e.Err }

func NewError(status int, message string, err error) *APIError {
	return &APIError{Status: status, Message: message, Err: err}
}

func ErrBadRequest(message string, err error) *APIError {
	return NewError(fiber.StatusBadRequest, message, err)
}

func ErrValidation(message string, err error) *APIError {
	return NewError(fiber.StatusUnprocessableEntity, message, err)
}

func ErrUnauthorized(message string, err error) *APIError {
	return NewError(fiber.StatusUnauthorized, message, err)
}

func ErrForbidden(message string, err error) *APIError {
	return NewError(fiber.StatusForbidden, message, err)
}

func ErrNotFound(message string, err error) *APIError {
	return NewError(fiber.StatusNotFound, message, err)
}

func ErrConflict(message string, err error) *APIError {
	return NewError(fiber.StatusConflict, message, err)
}

func ErrTooManyRequests(message string, err error) *APIError {
	return NewError(fiber.StatusTooManyRequests, message, err)
}

func ErrInternal(message string, err error) *APIError {
	return NewError(fiber.StatusInternalServerError, message, err)
}

// ErrorHandler is the single central place every failure response is rendered from.
// It maps APIErrors, context cancellations, timeouts, and framework errors into the
// single canonical generic.Response schema.
func ErrorHandler(c *fiber.Ctx, err error) error {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		if errors.Is(apiErr.Err, context.Canceled) {
			c.Locals("handler_error", apiErr.Err)
			return json[*struct{}](c, 499, false, "Request was canceled.", nil, apiErr.Err)
		}
		if errors.Is(apiErr.Err, context.DeadlineExceeded) {
			c.Locals("handler_error", apiErr.Err)
			return json[*struct{}](c, fiber.StatusGatewayTimeout, false, "Request timed out.", nil, apiErr.Err)
		}
		return json(c, apiErr.Status, false, apiErr.Message, apiErr.Data, apiErr.Err)
	}

	if errors.Is(err, context.Canceled) {
		c.Locals("handler_error", err)
		return json[*struct{}](c, 499, false, "Request was canceled.", nil, err)
	}
	if errors.Is(err, context.DeadlineExceeded) {
		c.Locals("handler_error", err)
		return json[*struct{}](c, fiber.StatusGatewayTimeout, false, "Request timed out.", nil, err)
	}

	code := fiber.StatusInternalServerError
	if fe, ok := err.(*fiber.Error); ok {
		code = fe.Code
	}

	c.Locals("handler_error", err)

	if code == fiber.StatusNotFound {
		return json[*struct{}](c, fiber.StatusNotFound, false, "Requested resource not found.", nil, err)
	}

	// Anything else (framework error or recovered panic) falls back to generic message
	return json[*struct{}](c, code, false, "An unexpected error occurred.", nil, nil)
}
