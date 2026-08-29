package faqs

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handlePublicList(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.ErrBadRequest("Course ID query param required.", nil)
	}

	faqs, err := a.PublicList(c.Context(), courseID)
	if err != nil {
		return err
	}

	return utils.OK(c, "FAQs fetched successfully.", faqs)
}

func (a *App) handleList(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.ErrBadRequest("Course ID query param required.", nil)
	}

	userID := middlewares.UserID(c)
	faqs, err := a.List(c.Context(), courseID, userID, scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "FAQs fetched successfully.", faqs)
}

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateFaqRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.ErrBadRequest("Course ID query param required.", nil)
	}

	faq, err := a.Create(c.Context(), middlewares.UserID(c), courseID, req)
	if err != nil {
		return err
	}

	return utils.Created(c, "FAQ created successfully.", faq)
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req UpdateFaqRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	faq, err := a.Update(c.Context(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "FAQ updated successfully.", faq)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	id, err := a.Delete(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "FAQ deleted successfully.", generic.DeleteResponse{ID: id})
}
