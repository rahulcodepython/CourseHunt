package controllers

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type NotesController struct {
	Repo *repositories.NotesRepository
	Cfg  *config.Config
}

func NewNotesController(repo *repositories.NotesRepository, cfg *config.Config) *NotesController {
	return &NotesController{Repo: repo, Cfg: cfg}
}

func (ctrl *NotesController) UpsertController(c *fiber.Ctx) error {
	var req entities.UpsertNoteRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	n, err := ctrl.Repo.UpsertRepository(userID, lessonID, req.Content)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNotesLessonNotFound):
			return utils.NotFound(c, "Lesson not found.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		default:
			return utils.InternalError(c, "Failed to save note.", err)
		}
	}

	ctrl.Repo.Cache.InvalidateNotes(c.Context())

	return utils.OK(c, "Note saved.", n)
}

func (ctrl *NotesController) ReadController(c *fiber.Ctx) error {
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("notes:read:u:%s:l:%s", userID, lessonID)

	var cached entities.NoteResponse
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Note fetched.", cached)
	}

	n, err := ctrl.Repo.ReadRepository(userID, lessonID)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNotesLessonNotFound):
			return utils.NotFound(c, "Lesson not found.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		case errors.Is(err, generic.ErrNoteNotFound):
			return utils.NotFound(c, "Note not found.", err)
		default:
			return utils.InternalError(c, "Failed to fetch note.", err)
		}
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, n, 10*time.Minute)

	return utils.OK(c, "Note fetched.", n)
}

func (ctrl *NotesController) UpdateController(c *fiber.Ctx) error {
	var req entities.UpsertNoteRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	n, err := ctrl.Repo.UpdateRepository(c.Params("id"), utils.GetUserID(c), req.Content)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNoteNotFound):
			return utils.NotFound(c, "Note not found.", err)
		case errors.Is(err, generic.ErrNotesAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own this note.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		default:
			return utils.InternalError(c, "Failed to update note.", err)
		}
	}

	ctrl.Repo.Cache.InvalidateNotes(c.Context())

	return utils.OK(c, "Note updated.", n)
}

func (ctrl *NotesController) DeleteController(c *fiber.Ctx) error {
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNoteNotFound):
			return utils.NotFound(c, "Note not found.", err)
		case errors.Is(err, generic.ErrNotesAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own this note.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		default:
			return utils.InternalError(c, "Failed to delete note.", err)
		}
	}

	ctrl.Repo.Cache.InvalidateNotes(c.Context())

	return utils.OK(c, "Note deleted.", generic.DeleteResponse{ID: id})
}
