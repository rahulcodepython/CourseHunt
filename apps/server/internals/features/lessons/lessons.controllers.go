package lessons

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleList(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)
	chapterID, err := utils.RequireQuery(c, "chapter_id", "Chapter ID")
	if err != nil {
		return err
	}

	userID := middlewares.UserID(c)
	lessons, err := a.List(c.Context(), chapterID, userID, scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Lessons fetched successfully.", lessons)
}

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateLessonRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	chapterID, err := utils.RequireQuery(c, "chapter_id", "Chapter ID")
	if err != nil {
		return err
	}

	l, err := a.Create(c.Context(), middlewares.UserID(c), chapterID, req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Lesson created successfully.", l)
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req UpdateLessonRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	l, err := a.Update(c.Context(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Lesson updated successfully.", l)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	id, err := a.Delete(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Lesson deleted successfully.", generic.DeleteResponse{ID: id})
}

func (a *App) handleUpsertVideoContent(c *fiber.Ctx) error {
	var req UpsertVideoContentRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	vc, err := a.UpsertVideoContent(c.Context(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Video content updated successfully.", vc)
}

func (a *App) handleUpsertDocumentContent(c *fiber.Ctx) error {
	var req UpsertDocumentContentRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	dc, err := a.UpsertDocumentContent(c.Context(), c.Params("id"), middlewares.UserID(c), req.Content)
	if err != nil {
		return err
	}

	return utils.OK(c, "Document content updated successfully.", dc)
}

func (a *App) handleReadContent(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)
	lessonID := c.Params("id")
	userID := middlewares.UserID(c)

	resp, err := a.ReadContent(c.Context(), lessonID, userID, scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Lesson content fetched successfully.", resp)
}

func (a *App) handleReadContentForTutor(c *fiber.Ctx) error {
	lessonID := c.Params("id")
	userID := middlewares.UserID(c)

	resp, err := a.ReadContentForTutor(c.Context(), lessonID, userID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Lesson content fetched successfully.", resp)
}

func (a *App) handleUpdateComplete(c *fiber.Ctx) error {
	lessonID := c.Params("id")
	userID := middlewares.UserID(c)

	if err := a.UpdateComplete(c.Context(), lessonID, userID); err != nil {
		return err
	}

	return utils.OK(c, "Lesson marked as complete.", LessonCompleteResponse{LessonID: lessonID, Completed: true})
}

func (a *App) handleCreateResource(c *fiber.Ctx) error {
	var req AddResourceRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	res, err := a.CreateResource(c.Context(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Resource added successfully.", res)
}

func (a *App) handleDeleteResource(c *fiber.Ctx) error {
	id, err := a.DeleteResource(c.Context(), c.Params("resourceID"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Resource deleted successfully.", generic.DeleteResponse{ID: id})
}

func (a *App) handleReadResourcesForTutor(c *fiber.Ctx) error {
	resources, err := a.ReadResourcesForTutor(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Resources fetched successfully.", resources)
}

func (a *App) handleReadResources(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)
	resources, err := a.ReadResources(c.Context(), c.Params("id"), middlewares.UserID(c), scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Resources fetched successfully.", resources)
}
