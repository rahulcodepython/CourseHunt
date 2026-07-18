package category

import (
	"coursehunt/api/internals/models"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CategoryModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	cats, total, err := m.ListRepository(page, limit, c.Query("name"))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch categories.", err)
	}
	return utils.OK(c, "Categories fetched successfully.", models.PaginatedResponse[[]Category]{
		Data: cats, Total: total, Page: page, Limit: limit,
	})
}

func (m *CategoryModule) CreateController(c *fiber.Ctx) error {
	var req CreateCategoryRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	cat, err := m.CreateRepository(req.Name, req.ParentID)
	if err != nil {
		return utils.InternalError(c, "Failed to create category.", err)
	}
	return utils.Created(c, "Category created successfully.", cat)
}

func (m *CategoryModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to delete category.", err)
	}
	return utils.OK(c, "Category deleted successfully.", models.DeleteResponse{ID: id})
}

func (m *CategoryModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateCategoryRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	cat, err := m.UpdateRepository(c.Params("id"), req.Name)
	if err != nil {
		return utils.InternalError(c, "Failed to update category.", err)
	}
	return utils.OK(c, "Category updated successfully.", cat)
}
