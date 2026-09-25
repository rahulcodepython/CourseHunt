package utils

import (
	"errors"
	"strings"

	"coursehunt/server/internals/generic"

	"github.com/go-playground/locales/en"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	entranslations "github.com/go-playground/validator/v10/translations/en"
	"github.com/gofiber/fiber/v2"
)

var (
	validate  = validator.New()
	validateT ut.Translator
)

func init() {
	locale := en.New()
	translator := ut.New(locale, locale)
	validateT, _ = translator.GetTranslator("en")
	// Humanizes struct-tag validation errors ("Title is a required field")
	// instead of the raw "Field: tag" pairing.
	_ = entranslations.RegisterDefaultTranslations(validate, validateT)
}

// ValidateStruct validates a struct according to its struct tags and translates error messages.
func ValidateStruct(s interface{}) error {
	if err := validate.Struct(s); err != nil {
		var errs []string
		if valErrors, ok := err.(validator.ValidationErrors); ok {
			for _, fe := range valErrors {
				errs = append(errs, fe.Translate(validateT))
			}
			return errors.New(strings.Join(errs, "; "))
		}
		return err
	}
	return nil
}

// BindAndValidate parses the JSON body into dst and runs struct-tag
// validation — the only sanctioned way to read a request body. Returns nil
// on success, or an *APIError ready to be returned straight from the handler.
func BindAndValidate(c *fiber.Ctx, dst interface{}) error {
	if err := c.BodyParser(dst); err != nil {
		return ErrBadRequest(generic.ErrMsgInvalidRequestBody, err)
	}
	if err := ValidateStruct(dst); err != nil {
		return ErrValidation(generic.ErrMsgValidationFailed, err)
	}
	return nil
}
