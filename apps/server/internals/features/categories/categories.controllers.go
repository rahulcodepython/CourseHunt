package categories

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	name := c.Query("name")

	cats, total, err := a.List(c.Context(), page, limit, name)
	if err != nil {
		return err
	}

	return utils.OK(c, "Categories fetched successfully.", generic.PaginatedResponse[[]Category]{
		Data: cats, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateCategoryRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	cat, err := a.Create(c.Context(), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Category created successfully.", cat)
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req UpdateCategoryRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	cat, err := a.Update(c.Context(), c.Params("id"), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Category updated successfully.", cat)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	id, err := a.Delete(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Category deleted successfully.", generic.DeleteResponse{ID: id})
}
