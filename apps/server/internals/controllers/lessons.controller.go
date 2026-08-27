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

type LessonsController struct {
	Repo *repositories.LessonsRepository
	Cfg  *config.Config
}

func NewLessonsController(repo *repositories.LessonsRepository, cfg *config.Config) *LessonsController {
	return &LessonsController{Repo: repo, Cfg: cfg}
}

func (ctrl *LessonsController) ListController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	chapterID := c.Query("chapter_id")
	if chapterID == "" {
		return utils.BadRequest(c, "Chapter ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("lessons:list:chap:%s:u:%s:s:%v", chapterID, userID, scope)

	var cached []entities.Lesson
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Lessons fetched successfully.", cached)
	}

	lessons, err := ctrl.Repo.ListRepository(chapterID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsChapterNotFound) {
			return utils.NotFound(c, "Chapter not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch lessons.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, lessons, 10*time.Minute)

	return utils.OK(c, "Lessons fetched successfully.", lessons)
}

func (ctrl *LessonsController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	chapterID := c.Query("chapter_id")
	if chapterID == "" {
		return utils.BadRequest(c, "Chapter ID query param required.", nil)
	}
	l, err := ctrl.Repo.CreateRepository(userID, chapterID, req)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsChapterNotFound) {
			return utils.NotFound(c, "Chapter not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to create lesson.", err)
	}

	ctrl.Repo.Cache.InvalidateLessons(c.Context())

	return utils.Created(c, "Lesson created successfully.", l)
}

func (ctrl *LessonsController) UpdateController(c *fiber.Ctx) error {
	var req entities.UpdateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	l, cleanup, err := ctrl.Repo.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update lesson.", err)
	}

	if cleanup != nil && req.PreviewVideoURL != nil {
		minio.MINIO.DeleteIfReplaced(c.Context(), cleanup.OldPreviewVideoURL, *req.PreviewVideoURL)
	}

	ctrl.Repo.Cache.InvalidateLessons(c.Context())

	return utils.OK(c, "Lesson updated successfully.", l)
}

func (ctrl *LessonsController) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to delete lesson.", err)
	}

	ctrl.Repo.Cache.InvalidateLessons(c.Context())

	return utils.OK(c, "Lesson deleted successfully.", generic.DeleteResponse{ID: id})
}

func (ctrl *LessonsController) UpsertVideoContentController(c *fiber.Ctx) error {
	var req entities.UpsertVideoContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	vc, cleanup, err := ctrl.Repo.UpsertVideoContentRepository(c.Params("id"), userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update video content.", err)
	}

	if cleanup != nil {
		minio.MINIO.DeleteIfReplaced(c.Context(), cleanup.OldVideoURL, req.VideoURL)
	}

	ctrl.Repo.Cache.InvalidateLessons(c.Context())

	return utils.OK(c, "Video content updated successfully.", vc)
}

func (ctrl *LessonsController) UpsertDocumentContentController(c *fiber.Ctx) error {
	var req entities.UpsertDocumentContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	dc, err := ctrl.Repo.UpsertDocumentContentRepository(c.Params("id"), userID, req.Content)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update document content.", err)
	}

	ctrl.Repo.Cache.InvalidateLessons(c.Context())

	return utils.OK(c, "Document content updated successfully.", dc)
}

func (ctrl *LessonsController) ReadContentController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	lessonID := c.Params("id")
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("lessons:content:id:%s:u:%s:s:%v", lessonID, userID, scope)

	var cached entities.AggregatedLessonContentResponse
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Lesson content fetched successfully.", cached)
	}

	resp, err := ctrl.Repo.ReadContentRepository(lessonID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to fetch lesson content.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, resp, 10*time.Minute)

	return utils.OK(c, "Lesson content fetched successfully.", resp)
}

// ReadContentForTutorController is the tutor-authoring counterpart to
// ReadContentController — gated by course ownership (PermTutorCoursesManage
// route guard + ownership check in the repository) instead of enrollment, so
// a tutor can view their own lesson's content while editing it.
func (ctrl *LessonsController) ReadContentForTutorController(c *fiber.Ctx) error {
	lessonID := c.Params("id")
	userID := utils.GetUserID(c)

	resp, err := ctrl.Repo.ReadContentForTutorRepository(lessonID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch lesson content.", err)
	}

	return utils.OK(c, "Lesson content fetched successfully.", resp)
}

func (ctrl *LessonsController) UpdateCompleteController(c *fiber.Ctx) error {
	if err := ctrl.Repo.MarkLessonCompleteRepository(utils.GetUserID(c), c.Params("id")); err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to mark lesson complete.", err)
	}

	ctrl.Repo.Cache.InvalidateLessons(c.Context())

	return utils.OK(c, "Lesson marked as complete.", entities.LessonCompleteResponse{LessonID: c.Params("id"), Completed: true})
}

func (ctrl *LessonsController) CreateResourceController(c *fiber.Ctx) error {
	var req entities.AddResourceRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	res, err := ctrl.Repo.CreateResourceRepository(c.Params("id"), userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to add resource.", err)
	}

	ctrl.Repo.Cache.InvalidateLessons(c.Context())

	return utils.Created(c, "Resource added successfully.", res)
}

func (ctrl *LessonsController) DeleteResourceController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, fileURL, err := ctrl.Repo.DeleteResourceRepository(c.Params("resourceID"), userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsResourceNotFound) {
			return utils.NotFound(c, "Resource not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to delete resource.", err)
	}

	minio.MINIO.DeleteIfReplaced(c.Context(), &fileURL, "")

	ctrl.Repo.Cache.InvalidateLessons(c.Context())

	return utils.OK(c, "Resource deleted successfully.", generic.DeleteResponse{ID: id})
}

// ReadResourcesForTutorController is the tutor-authoring counterpart to
// ReadResourcesController — gated by course ownership instead of enrollment.
func (ctrl *LessonsController) ReadResourcesForTutorController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	lessonID := c.Params("id")

	resources, err := ctrl.Repo.ReadResourcesForTutorRepository(lessonID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch resources.", err)
	}

	return utils.OK(c, "Resources fetched successfully.", resources)
}

func (ctrl *LessonsController) ReadResourcesController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	userID := utils.GetUserID(c)
	lessonID := c.Params("id")
	cacheKey := fmt.Sprintf("lessons:resources:id:%s:u:%s:s:%v", lessonID, userID, scope)

	var cached []entities.LessonResource
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Resources fetched successfully.", cached)
	}

	resources, err := ctrl.Repo.ReadResourcesRepository(lessonID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to fetch resources.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, resources, 10*time.Minute)

	return utils.OK(c, "Resources fetched successfully.", resources)
}
