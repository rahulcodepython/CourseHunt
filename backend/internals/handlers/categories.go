package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type CategoryHandler struct{ Svc *services.CategoryService }
func NewCategoryHandler() *CategoryHandler { return &CategoryHandler{Svc: services.NewCategoryService()} }

func (h *CategoryHandler) List(c *fiber.Ctx) error {
	cats, err := h.Svc.List()
	if err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch categories", nil, err.Error()) }
	return utils.JSON(c, http.StatusOK, true, "categories fetched successfully", cats, nil)
}
func (h *CategoryHandler) Create(c *fiber.Ctx) error {
	var req models.CreateCategoryRequest
	if ok, err := utils.Validate(c, &req); !ok { return err }
	cat, err := h.Svc.Create(req)
	if err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to create category", nil, err.Error()) }
	return utils.JSON(c, http.StatusCreated, true, "category created successfully", cat, nil)
}
func (h *CategoryHandler) Delete(c *fiber.Ctx) error {
	if err := h.Svc.Delete(c.Params("id")); err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete category", nil, err.Error()) }
	return utils.JSON(c, http.StatusOK, true, "category deleted successfully", nil, nil)
}
func (h *CategoryHandler) CreateSub(c *fiber.Ctx) error {
	var req models.CreateSubcategoryRequest
	if ok, err := utils.Validate(c, &req); !ok { return err }
	sub, err := h.Svc.CreateSub(c.Params("id"), req)
	if err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to create subcategory", nil, err.Error()) }
	return utils.JSON(c, http.StatusCreated, true, "subcategory created successfully", sub, nil)
}
func (h *CategoryHandler) DeleteSub(c *fiber.Ctx) error {
	if err := h.Svc.DeleteSub(c.Params("subID")); err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete subcategory", nil, err.Error()) }
	return utils.JSON(c, http.StatusOK, true, "subcategory deleted successfully", nil, nil)
}
