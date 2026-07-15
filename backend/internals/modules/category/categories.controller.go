package category

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CategoryModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	cats, total, err := m.ListRepository(page, limit, c.Query("name"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch categories.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Categories fetched successfully.", models.PaginatedResponse[[]Category]{
		Data: cats, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *CategoryModule) CreateController(c *fiber.Ctx) error {
	var req CreateCategoryRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	cat, err := m.CreateRepository(req.Name, req.ParentID)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to create category.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Category created successfully.", cat, nil)
}

func (m *CategoryModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete category.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Category deleted successfully.", map[string]string{"id": id}, nil)
}

func (m *CategoryModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateCategoryRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	cat, err := m.UpdateRepository(c.Params("id"), req.Name)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update category.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Category updated successfully.", cat, nil)
}
