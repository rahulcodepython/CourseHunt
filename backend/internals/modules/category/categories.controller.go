package category

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (c *CategoryModule) ListController(ctx *fiber.Ctx) error {
	cats, err := c.ListService()
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch categories", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "categories fetched successfully", cats, nil)
}

func (c *CategoryModule) CreateController(ctx *fiber.Ctx) error {
	var req CreateCategoryRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	cat, err := c.CreateService(req)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to create category", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusCreated, true, "category created successfully", cat, nil)
}

func (c *CategoryModule) DeleteController(ctx *fiber.Ctx) error {
	id, err := c.DeleteService(ctx.Params("id"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete category", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "category deleted successfully", map[string]string{"id": id}, nil)
}

func (c *CategoryModule) UpdateController(ctx *fiber.Ctx) error {
	var req UpdateCategoryRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	cat, err := c.UpdateService(ctx.Params("id"), req)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to update category", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "category updated successfully", cat, nil)
}
