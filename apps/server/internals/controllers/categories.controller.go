package controllers

import (
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type CategoriesController struct {
	Repo *repositories.CategoriesRepository
	Cfg  *config.Config
}

func NewCategoriesController(repo *repositories.CategoriesRepository, cfg *config.Config) *CategoriesController {
	return &CategoriesController{Repo: repo, Cfg: cfg}
}

type categoryListCacheData struct {
	Cats  []entities.Category `json:"cats"`
	Total int                 `json:"total"`
}

func (ctrl *CategoriesController) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	name := c.Query("name")

	cacheKey := fmt.Sprintf("categories:list:page:%d:limit:%d:name:%s", page, limit, name)

	var cached categoryListCacheData
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Categories fetched successfully.", generic.PaginatedResponse[[]entities.Category]{
			Data: cached.Cats, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	cats, total, err := ctrl.Repo.ListRepository(page, limit, name)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch categories.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, categoryListCacheData{Cats: cats, Total: total}, 10*time.Minute)

	return utils.OK(c, "Categories fetched successfully.", generic.PaginatedResponse[[]entities.Category]{
		Data: cats, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *CategoriesController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateCategoryRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	cat, err := ctrl.Repo.CreateRepository(req.Name, req.ParentID)
	if err != nil {
		return utils.InternalError(c, "Failed to create category.", err)
	}

	ctrl.Repo.Cache.InvalidateCategories(c.Context())

	return utils.Created(c, "Category created successfully.", cat)
}

func (ctrl *CategoriesController) DeleteController(c *fiber.Ctx) error {
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to delete category.", err)
	}

	ctrl.Repo.Cache.InvalidateCategories(c.Context())

	return utils.OK(c, "Category deleted successfully.", generic.DeleteResponse{ID: id})
}

func (ctrl *CategoriesController) UpdateController(c *fiber.Ctx) error {
	var req entities.UpdateCategoryRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	cat, err := ctrl.Repo.UpdateRepository(c.Params("id"), req.Name)
	if err != nil {
		return utils.InternalError(c, "Failed to update category.", err)
	}

	ctrl.Repo.Cache.InvalidateCategories(c.Context())

	return utils.OK(c, "Category updated successfully.", cat)
}
