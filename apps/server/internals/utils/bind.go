package utils

import (
	"errors"
	"strings"

	"coursehunt/server/internals/generic"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate = validator.New()

// BindAndValidate parses the JSON body into dst and runs struct-tag
// validation — the only sanctioned way to read a request body. Returns nil
// on success, or an *APIError ready to be returned straight from the
// handler (`if err := utils.BindAndValidate(c, &req); err != nil { return err }`).
func BindAndValidate(c *fiber.Ctx, dst any) error {
	if err := c.BodyParser(dst); err != nil {
		return ErrBadRequest(generic.ErrMsgInvalidRequestBody, err)
	}
	if err := validate.Struct(dst); err != nil {
		errs := []string{}
		for _, fe := range err.(validator.ValidationErrors) {
			errs = append(errs, fe.Field()+": "+fe.Tag())
		}
		return ErrValidation(generic.ErrMsgValidationFailed, errors.New(strings.Join(errs, "; ")))
	}
	return nil
}
