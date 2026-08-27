package utils

import (
	"errors"
	"strings"

	"coursehunt/server/internals/generic"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate = validator.New()

// Validate parses the JSON body into dst, validates it, and writes error response if invalid.
// Returns (true, nil) on success, (false, err) on validation failure.
func Validate(c *fiber.Ctx, dst interface{}) (bool, error) {
	if err := c.BodyParser(dst); err != nil {
		err2 := BadRequest(c, generic.ErrMsgInvalidRequestBody, err)
		return false, err2
	}
	if err := validate.Struct(dst); err != nil {
		errs := []string{}
		for _, fe := range err.(validator.ValidationErrors) {
			errs = append(errs, fe.Field()+": "+fe.Tag())
		}
		err2 := UnprocessableEntity(c, generic.ErrMsgValidationFailed, errors.New(strings.Join(errs, "; ")))
		return false, err2
	}
	return true, nil
}
