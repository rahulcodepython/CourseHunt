package category

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Category
// @Tags Category
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[[]Category]
// @Router /api/v1/categories [get]
func (c *CategoryModule) ListController(ctx *fiber.Ctx) error {
	cats, err := c.ListRepository()
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch categories", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "categories fetched successfully", cats, nil)
}

// @Summary CreateController
// @Description CreateController for Category
// @Tags Category
// @Accept json
// @Produce json
// @Param body body category.CreateCategoryRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Category]
// @Router /api/v1/categories [post]
func (c *CategoryModule) CreateController(ctx *fiber.Ctx) error {
	var req CreateCategoryRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	cat, err := c.CreateRepository(req.Name, req.ParentID)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to create category", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusCreated, true, "category created successfully", cat, nil)
}

// @Summary DeleteController
// @Description DeleteController for Category
// @Tags Category
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/categories/{id} [delete]
func (c *CategoryModule) DeleteController(ctx *fiber.Ctx) error {
	id, err := c.DeleteRepository(ctx.Params("id"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete category", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "category deleted successfully", map[string]string{"id": id}, nil)
}

// @Summary UpdateController
// @Description UpdateController for Category
// @Tags Category
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body category.UpdateCategoryRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Category]
// @Router /api/v1/categories/{id} [patch]
func (c *CategoryModule) UpdateController(ctx *fiber.Ctx) error {
	var req UpdateCategoryRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	cat, err := c.UpdateRepository(ctx.Params("id"), req.Name)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to update category", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "category updated successfully", cat, nil)
}
