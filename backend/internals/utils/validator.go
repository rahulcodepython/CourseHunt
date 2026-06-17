package utils

import (
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate = validator.New()

// Validate parses the JSON body into dst, validates it, and writes error response if invalid.
// Returns (true, nil) on success, (false, err) on validation failure.
func Validate(c *fiber.Ctx, dst interface{}) (bool, error) {
	if err := c.BodyParser(dst); err != nil {
		err2 := JSON(c, fiber.StatusBadRequest, false, "invalid request body", nil, err.Error())
		return false, err2
	}
	if err := validate.Struct(dst); err != nil {
		errs := []string{}
		for _, fe := range err.(validator.ValidationErrors) {
			errs = append(errs, fe.Field()+": "+fe.Tag())
		}
		err2 := JSON(c, fiber.StatusUnprocessableEntity, false, "validation failed", nil, errs)
		return false, err2
	}
	return true, nil
}
