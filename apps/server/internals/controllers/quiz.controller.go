package controllers

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/services"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type QuizController struct {
	Svc  *services.QuizService
	Repo *repositories.QuizRepository
	Cfg  *config.Config
}

func NewQuizController(svc *services.QuizService, repo *repositories.QuizRepository, cfg *config.Config) *QuizController {
	return &QuizController{Svc: svc, Repo: repo, Cfg: cfg}
}

func (ctrl *QuizController) CreateMetadataController(c *fiber.Ctx) error {
	var req entities.CreateQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	tutorID := utils.GetUserID(c)
	qm, err := ctrl.Repo.CreateMetadataRepository(lessonID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizLessonNotFound):
			return utils.NotFound(c, "Lesson not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this lesson belongs to.", err)
		default:
			return utils.InternalError(c, "Failed to save quiz metadata.", err)
		}
	}

	ctrl.Repo.Cache.InvalidateQuiz(c.Context())

	return utils.OK(c, "Quiz saved successfully.", qm)
}

func (ctrl *QuizController) ReadMetadataController(c *fiber.Ctx) error {
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	scope := resolveScope(c)
	qm, err := ctrl.Repo.ReadMetadataRepository(lessonID, userID, scope)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizLessonNotFound):
			return utils.NotFound(c, "Lesson not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this lesson belongs to.", err)
		case errors.Is(err, generic.ErrQuizNotFound):
			return utils.NotFound(c, "Quiz not found.", err)
		default:
			return utils.InternalError(c, "Failed to fetch quiz metadata.", err)
		}
	}
	return utils.OK(c, "Quiz metadata fetched.", qm)
}

func (ctrl *QuizController) ListQuestionsController(c *fiber.Ctx) error {
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.BadRequest(c, "Quiz ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	scope := resolveScope(c)
	questions, err := ctrl.Repo.ListQuestionsRepository(quizID, userID, scope)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizNotFound):
			return utils.NotFound(c, "Quiz not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this quiz belongs to.", err)
		default:
			return utils.InternalError(c, "Failed to fetch questions.", err)
		}
	}
	return utils.OK(c, "Questions fetched.", questions)
}

func (ctrl *QuizController) CreateQuestionController(c *fiber.Ctx) error {
	var req entities.CreateQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.BadRequest(c, "Quiz ID query param required.", nil)
	}
	tutorID := utils.GetUserID(c)
	q, err := ctrl.Repo.CreateQuestionRepository(quizID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizNotFound):
			return utils.NotFound(c, "Quiz not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this quiz belongs to.", err)
		default:
			return utils.InternalError(c, "Failed to add question.", err)
		}
	}

	ctrl.Repo.Cache.InvalidateQuiz(c.Context())

	return utils.Created(c, "Question added successfully.", q)
}

func (ctrl *QuizController) DeleteQuestionController(c *fiber.Ctx) error {
	tutorID := utils.GetUserID(c)
	id, err := ctrl.Repo.DeleteQuestionRepository(c.Params("id"), tutorID)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizQuestionNotFound):
			return utils.NotFound(c, "Question not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this question belongs to.", err)
		default:
			return utils.InternalError(c, "Failed to delete question.", err)
		}
	}

	ctrl.Repo.Cache.InvalidateQuiz(c.Context())

	return utils.OK(c, "Question deleted successfully.", generic.DeleteResponse{ID: id})
}

func (ctrl *QuizController) GetQuestionController(c *fiber.Ctx) error {
	var req entities.NextQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.BadRequest(c, "Quiz ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("quiz:question:q:%s:u:%s:fq:%v", quizID, userID, req.FetchedQuestionIDs)

	var cached entities.NextQuestionResponse
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Question fetched.", cached)
	}

	resp, err := ctrl.Repo.GetQuestionRepository(quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizNotFound):
			return utils.NotFound(c, "Quiz not found.", err)
		case errors.Is(err, generic.ErrQuizNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in this course.", err)
		default:
			return utils.InternalError(c, "Failed to get question.", err)
		}
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, resp, 5*time.Minute)

	return utils.OK(c, "Question fetched.", resp)
}

func (ctrl *QuizController) CreateSubmitController(c *fiber.Ctx) error {
	var req entities.SubmitQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.BadRequest(c, "Quiz ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	resp, err := ctrl.Svc.SubmitQuizService(quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizNotFound):
			return utils.NotFound(c, "Quiz not found.", err)
		case errors.Is(err, generic.ErrQuizNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in this course.", err)
		default:
			return utils.InternalError(c, "Failed to submit quiz.", err)
		}
	}

	ctrl.Repo.Cache.InvalidateQuiz(c.Context())

	return utils.OK(c, "Quiz submitted successfully.", resp)
}
