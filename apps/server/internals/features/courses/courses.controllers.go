package courses

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handlePublicList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)

	cards, total, err := a.PublicList(c.Context(), page, limit, c.Query("category_id"), c.Query("subcategory_id"), c.Query("level"), c.Query("search"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Public courses fetched successfully.", generic.PaginatedResponse[[]CoursePublicResponse]{
		Data: cards, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handlePublicSingle(c *fiber.Ctx) error {
	resp, err := a.PublicSingle(c.Context(), c.Params("slug"), middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "Course details fetched successfully.", resp)
}

func (a *App) handleStudy(c *fiber.Ctx) error {
	resp, err := a.Study(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "Study page fetched successfully.", resp)
}

// handleEnrollFree enrolls the caller directly into a course marked
// is_free, bypassing the Razorpay flow entirely.
func (a *App) handleEnrollFree(c *fiber.Ctx) error {
	if err := a.EnrollFree(c.Context(), middlewares.UserID(c), c.Params("id")); err != nil {
		return err
	}
	return utils.OK[any](c, "Enrolled successfully.", nil)
}

func (a *App) handleEnrolledList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := a.EnrolledList(c.Context(), middlewares.UserID(c), page, limit)
	if err != nil {
		return err
	}
	return utils.OK(c, "Enrolled courses fetched successfully.", generic.PaginatedResponse[[]EnrolledCourseResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleManageList(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)
	page, limit := utils.PaginationParams(c)
	userID := middlewares.UserID(c)

	list, total, err := a.ManageList(c.Context(), page, limit,
		userID, scope,
		c.Query("category_id"),
		c.Query("subcategory_id"),
		c.Query("level"),
		c.Query("search"),
		c.Query("status"),
		c.Query("tutor_id"),
	)
	if err != nil {
		return err
	}
	return utils.OK(c, "Courses fetched successfully.", generic.PaginatedResponse[[]Course]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleGetByID(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)
	userID := middlewares.UserID(c)
	course, err := a.GetByID(c.Context(), c.Params("id"), userID, scope)
	if err != nil {
		return err
	}
	return utils.OK(c, "Course fetched successfully.", course)
}

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateCourseRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	resp, err := a.Create(c.Context(), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Course created successfully.", resp)
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req UpdateCourseRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	course, err := a.Update(c.Context(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Course updated successfully.", course)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	id, err := a.Delete(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "Course deleted successfully.", generic.DeleteResponse{ID: id})
}
