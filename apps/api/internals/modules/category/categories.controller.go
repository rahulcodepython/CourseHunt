package category

import (
	"fmt"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type categoryListCacheData struct {
	Cats  []Category `json:"cats"`
	Total int        `json:"total"`
}

func (m *CategoryModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	name := c.Query("name")

	cacheKey := fmt.Sprintf("categories:list:page:%d:limit:%d:name:%s", page, limit, name)

	var cached categoryListCacheData
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Categories fetched successfully.", generic.PaginatedResponse[[]Category]{
			Data: cached.Cats, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	cats, total, err := m.ListRepository(page, limit, name)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch categories.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, categoryListCacheData{Cats: cats, Total: total}, 10*time.Minute)

	return utils.OK(c, "Categories fetched successfully.", generic.PaginatedResponse[[]Category]{
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

	m.Cache.InvalidateCategories(c.Context())

	return utils.Created(c, "Category created successfully.", cat)
}

func (m *CategoryModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to delete category.", err)
	}

	m.Cache.InvalidateCategories(c.Context())

	return utils.OK(c, "Category deleted successfully.", generic.DeleteResponse{ID: id})
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

	m.Cache.InvalidateCategories(c.Context())

	return utils.OK(c, "Category updated successfully.", cat)
}
