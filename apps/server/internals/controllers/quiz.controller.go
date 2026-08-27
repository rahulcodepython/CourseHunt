package controllers

import (
	"errors"

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

func (ctrl *QuizController) UpdateQuestionController(c *fiber.Ctx) error {
	var req entities.CreateQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	questionID := c.Params("id")
	tutorID := utils.GetUserID(c)
	q, err := ctrl.Repo.UpdateQuestionRepository(questionID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizQuestionNotFound):
			return utils.NotFound(c, "Question not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this quiz belongs to.", err)
		default:
			return utils.InternalError(c, "Failed to update question.", err)
		}
	}

	ctrl.Repo.Cache.InvalidateQuiz(c.Context())

	return utils.OK(c, "Question updated successfully.", q)
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

	// Not cached: this picks a random not-yet-fetched question per call, so
	// caching by (quiz, user, fetched_ids) doesn't cache a stable answer —
	// it just risks serving a stale/empty result (e.g. a transient "no
	// question" response) on every retry for the cache's TTL.
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

func (ctrl *QuizController) ListAttemptsController(c *fiber.Ctx) error {
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.BadRequest(c, "Quiz ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	attempts, err := ctrl.Repo.ListAttemptsRepository(quizID, userID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch quiz attempts.", err)
	}
	return utils.OK(c, "Quiz attempts fetched.", attempts)
}

func (ctrl *QuizController) GetAttemptDetailController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	detail, err := ctrl.Repo.GetAttemptDetailRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, generic.ErrQuizAttemptNotFound) {
			return utils.NotFound(c, "Quiz attempt not found.", err)
		}
		return utils.InternalError(c, "Failed to fetch quiz attempt.", err)
	}
	return utils.OK(c, "Quiz attempt fetched.", detail)
}
