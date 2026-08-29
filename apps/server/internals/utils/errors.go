package utils

import "github.com/gofiber/fiber/v2"

// APIError is the only error type any handler/service returns up the call
// stack. Nothing below the HTTP layer writes a status code or JSON body
// directly — it constructs one of these and returns it, and the central
// ErrorHandler (errorHandler.go) renders it through the standard response
// envelope. Err carries the underlying cause for logging only; it is never
// serialized to the client.
type APIError struct {
	Status  int
	Message string
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

// ErrValidation is for request-shape/struct-tag validation failures —
// mirrors the project's existing use of 422 (not 400) for that case.
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
