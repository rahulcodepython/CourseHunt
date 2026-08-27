package controllers

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/minio"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type CoursesController struct {
	Repo *repositories.CoursesRepository
	Cfg  *config.Config
}

func NewCoursesController(repo *repositories.CoursesRepository, cfg *config.Config) *CoursesController {
	return &CoursesController{Repo: repo, Cfg: cfg}
}

type publicCoursesCacheData struct {
	Cards []entities.CoursePublicResponse `json:"cards"`
	Total int                             `json:"total"`
}

func (ctrl *CoursesController) PublicListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	catID := c.Query("category_id")
	subID := c.Query("subcategory_id")
	lvl := c.Query("level")
	search := c.Query("search")

	cacheKey := fmt.Sprintf("courses:public:list:p:%d:l:%d:c:%s:s:%s:lvl:%s:q:%s", page, limit, catID, subID, lvl, search)

	var cached publicCoursesCacheData
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Public courses fetched successfully.", generic.PaginatedResponse[[]entities.CoursePublicResponse]{
			Data: cached.Cards, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	cards, total, err := ctrl.Repo.PublicListRepository(page, limit, catID, subID, lvl, search)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch public courses.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, publicCoursesCacheData{Cards: cards, Total: total}, 5*time.Minute)

	return utils.OK(c, "Public courses fetched successfully.", generic.PaginatedResponse[[]entities.CoursePublicResponse]{
		Data: cards, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *CoursesController) PublicSingleController(c *fiber.Ctx) error {
	slug := c.Params("slug")
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("courses:public:single:slug:%s:u:%s", slug, userID)

	var cached entities.CourseLandingResponse
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Course details fetched successfully.", cached)
	}

	resp, err := ctrl.Repo.PublicSingleRepository(slug, userID)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		return utils.InternalError(c, "Failed to fetch course details.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, resp, 5*time.Minute)

	return utils.OK(c, "Course details fetched successfully.", resp)
}

func (ctrl *CoursesController) StudyController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	resp, err := ctrl.Repo.StudyMetadataRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch study page.", err)
	}
	return utils.OK(c, "Study page fetched successfully.", resp)
}

// EnrollFreeController enrolls the caller directly into a course marked
// is_free, bypassing the Razorpay flow entirely.
func (ctrl *CoursesController) EnrollFreeController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	if err := ctrl.Repo.EnrollFreeRepository(userID, c.Params("id")); err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesNotFree) {
			return utils.BadRequest(c, "This course is not free.", err)
		}
		return utils.InternalError(c, "Failed to enroll in course.", err)
	}
	return utils.OK[any](c, "Enrolled successfully.", nil)
}

func (ctrl *CoursesController) EnrolledListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := ctrl.Repo.EnrolledCoursesRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch enrolled courses.", err)
	}
	return utils.OK(c, "Enrolled courses fetched successfully.", generic.PaginatedResponse[[]entities.EnrolledCourseResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *CoursesController) ManageListController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)

	list, total, err := ctrl.Repo.ListRepository(page, limit,
		userID, scope,
		c.Query("category_id"),
		c.Query("subcategory_id"),
		c.Query("level"),
		c.Query("search"),
		c.Query("status"),
		c.Query("tutor_id"),
	)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch courses.", err)
	}
	return utils.OK(c, "Courses fetched successfully.", generic.PaginatedResponse[[]entities.Course]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *CoursesController) GetByIDController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	userID := utils.GetUserID(c)
	course, err := ctrl.Repo.GetByIDRepository(c.Params("id"), userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		return utils.InternalError(c, "Failed to fetch course.", err)
	}
	return utils.OK(c, "Course fetched successfully.", course)
}

func (ctrl *CoursesController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	// A free course has no price and never accepts coupons — enforced
	// server-side, not just left to the client UI to respect.
	if req.IsFree {
		req.FinalPrice = 0
		req.CouponAllowed = false
	}
	resp, err := ctrl.Repo.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.InternalError(c, "Failed to create course.", err)
	}

	ctrl.Repo.Cache.InvalidateCourses(c.Context())

	return utils.Created(c, "Course created successfully.", resp)
}

func (ctrl *CoursesController) UpdateController(c *fiber.Ctx) error {
	var req entities.UpdateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	// A free course has no price and never accepts coupons — enforced
	// server-side, not just left to the client UI to respect.
	if req.IsFree != nil && *req.IsFree {
		zero := 0.0
		req.FinalPrice = &zero
		notAllowed := false
		req.CouponAllowed = &notAllowed
	}
	userID := utils.GetUserID(c)
	course, cleanup, err := ctrl.Repo.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update course.", err)
	}

	if cleanup != nil {
		if req.ImageURL != nil {
			minio.MINIO.DeleteIfReplaced(c.Context(), cleanup.OldImageURL, *req.ImageURL)
		}
		if req.PreviewVideoURL != nil {
			minio.MINIO.DeleteIfReplaced(c.Context(), cleanup.OldPreviewVideoURL, *req.PreviewVideoURL)
		}
	}

	ctrl.Repo.Cache.InvalidateCourses(c.Context())

	return utils.OK(c, "Course updated successfully.", course)
}

func resolveScope(c *fiber.Ctx) generic.AuthScope {
	perm, _ := c.Locals("permission").(string)
	return generic.ScopeFromPermission(perm)
}

func (ctrl *CoursesController) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to delete course.", err)
	}

	ctrl.Repo.Cache.InvalidateCourses(c.Context())

	return utils.OK(c, "Course deleted successfully.", generic.DeleteResponse{ID: id})
}
