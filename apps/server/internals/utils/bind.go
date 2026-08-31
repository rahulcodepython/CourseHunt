package utils

import (
	"coursehunt/server/internals/generic"

	"github.com/gofiber/fiber/v2"
)

// BindAndValidate parses the JSON body into dst and runs struct-tag
// validation — the only sanctioned way to read a request body. Returns nil
// on success, or an *APIError ready to be returned straight from the handler.
func BindAndValidate(c *fiber.Ctx, dst any) error {
	if err := c.BodyParser(dst); err != nil {
		return ErrBadRequest(generic.ErrMsgInvalidRequestBody, err)
	}
	if err := ValidateStruct(dst); err != nil {
		return ErrValidation(generic.ErrMsgValidationFailed, err)
	}
	return nil
}
