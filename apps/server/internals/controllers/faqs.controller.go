package controllers

import (
	"errors"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type FaqsController struct {
	Repo *repositories.FaqsRepository
	Cfg  *config.Config
}

func NewFaqsController(repo *repositories.FaqsRepository, cfg *config.Config) *FaqsController {
	return &FaqsController{Repo: repo, Cfg: cfg}
}

// PublicListController is unauthenticated — used by the public course detail page.
func (ctrl *FaqsController) PublicListController(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.BadRequest(c, "Course ID query param required.", nil)
	}
	faqs, err := ctrl.Repo.PublicListRepository(courseID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch FAQs.", err)
	}
	return utils.OK(c, "FAQs fetched successfully.", faqs)
}

func (ctrl *FaqsController) ListController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.BadRequest(c, "Course ID query param required.", nil)
	}
	userID := utils.GetUserID(c)

	faqs, err := ctrl.Repo.ListRepository(courseID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrFaqsCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch FAQs.", err)
	}

	return utils.OK(c, "FAQs fetched successfully.", faqs)
}

func (ctrl *FaqsController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateFaqRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.BadRequest(c, "Course ID query param required.", nil)
	}
	faq, err := ctrl.Repo.CreateRepository(utils.GetUserID(c), courseID, req)
	if err != nil {
		if errors.Is(err, generic.ErrFaqsCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to create FAQ.", err)
	}

	ctrl.Repo.Cache.InvalidateFaqs(c.Context())

	return utils.Created(c, "FAQ created successfully.", faq)
}

func (ctrl *FaqsController) UpdateController(c *fiber.Ctx) error {
	var req entities.UpdateFaqRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	faq, err := ctrl.Repo.UpdateRepository(c.Params("id"), utils.GetUserID(c), req)
	if err != nil {
		if errors.Is(err, generic.ErrFaqsFaqNotFound) {
			return utils.NotFound(c, "FAQ not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update FAQ.", err)
	}

	ctrl.Repo.Cache.InvalidateFaqs(c.Context())

	return utils.OK(c, "FAQ updated successfully.", faq)
}

func (ctrl *FaqsController) DeleteController(c *fiber.Ctx) error {
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		if errors.Is(err, generic.ErrFaqsFaqNotFound) {
			return utils.NotFound(c, "FAQ not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to delete FAQ.", err)
	}

	ctrl.Repo.Cache.InvalidateFaqs(c.Context())

	return utils.OK(c, "FAQ deleted successfully.", generic.DeleteResponse{ID: id})
}
