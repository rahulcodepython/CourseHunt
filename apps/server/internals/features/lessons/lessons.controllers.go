package lessons

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// --- Admin Handlers ---

func (a *App) handleAdminList(c *fiber.Ctx) error {
	chapterID, err := utils.RequireQuery(c, "chapter_id", "Chapter ID")
	if err != nil {
		return err
	}

	lessons, err := a.AdminList(c.Context(), chapterID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Lessons fetched successfully.", lessons)
}

func (a *App) handleAdminReadContent(c *fiber.Ctx) error {
	resp, err := a.AdminReadContent(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Lesson content fetched successfully.", resp)
}

func (a *App) handleAdminReadResources(c *fiber.Ctx) error {
	resources, err := a.AdminReadResources(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Resources fetched successfully.", resources)
}

// --- Tutor Handlers ---

func (a *App) handleTutorList(c *fiber.Ctx) error {
	chapterID, err := utils.RequireQuery(c, "chapter_id", "Chapter ID")
	if err != nil {
		return err
	}

	userID := middlewares.UserID(c)
	lessons, err := a.TutorList(c.Context(), chapterID, userID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Lessons fetched successfully.", lessons)
}

func (a *App) handleTutorReadContent(c *fiber.Ctx) error {
	lessonID := c.Params("id")
	userID := middlewares.UserID(c)

	resp, err := a.TutorReadContent(c.Context(), lessonID, userID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Lesson content fetched successfully.", resp)
}

func (a *App) handleTutorReadResources(c *fiber.Ctx) error {
	resources, err := a.TutorReadResources(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Resources fetched successfully.", resources)
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

// --- Student Handlers ---

func (a *App) handleStudentReadContent(c *fiber.Ctx) error {
	lessonID := c.Params("id")
	userID := middlewares.UserID(c)

	resp, err := a.StudentReadContent(c.Context(), lessonID, userID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Lesson content fetched successfully.", resp)
}

func (a *App) handleStudentReadResources(c *fiber.Ctx) error {
	resources, err := a.StudentReadResources(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Resources fetched successfully.", resources)
}

func (a *App) handleUpdateComplete(c *fiber.Ctx) error {
	lessonID := c.Params("id")
	userID := middlewares.UserID(c)

	if err := a.UpdateComplete(c.Context(), lessonID, userID); err != nil {
		return err
	}

	return utils.OK(c, "Lesson marked as complete.", LessonCompleteResponse{LessonID: lessonID, Completed: true})
}
