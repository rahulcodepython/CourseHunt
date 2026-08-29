package chapters

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleList(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.ErrBadRequest("Course ID query param required.", nil)
	}

	userID := middlewares.UserID(c)
	chapters, err := a.List(c.Context(), courseID, userID, scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Chapters fetched successfully.", chapters)
}

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateChapterRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.ErrBadRequest("Course ID query param required.", nil)
	}

	ch, err := a.Create(c.Context(), middlewares.UserID(c), courseID, req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Chapter created successfully.", ch)
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req UpdateChapterRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	ch, err := a.Update(c.Context(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Chapter updated successfully.", ch)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	id, err := a.Delete(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Chapter deleted successfully.", generic.DeleteResponse{ID: id})
}
