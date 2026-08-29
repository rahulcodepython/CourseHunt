package notes

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleUpsert(c *fiber.Ctx) error {
	var req UpsertNoteRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.ErrBadRequest("Lesson ID query param required.", nil)
	}

	n, err := a.Upsert(c.Context(), middlewares.UserID(c), lessonID, req.Content)
	if err != nil {
		return err
	}

	return utils.OK(c, "Note saved.", n)
}

func (a *App) handleRead(c *fiber.Ctx) error {
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.ErrBadRequest("Lesson ID query param required.", nil)
	}

	n, err := a.Read(c.Context(), middlewares.UserID(c), lessonID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Note fetched.", n)
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req UpsertNoteRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	n, err := a.Update(c.Context(), c.Params("id"), middlewares.UserID(c), req.Content)
	if err != nil {
		return err
	}

	return utils.OK(c, "Note updated.", n)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	id, err := a.Delete(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Note deleted.", generic.DeleteResponse{ID: id})
}
