package quiz

import (
	"errors"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *QuizModule) CreateMetadataController(c *fiber.Ctx) error {
	var req CreateQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	tutorID := utils.GetUserID(c)
	qm, err := m.CreateMetadataRepository(lessonID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.NotFound(c, "Lesson not found.", err)
		case errors.Is(err, ErrAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this lesson belongs to.", err)
		default:
			return utils.InternalError(c, "Failed to save quiz metadata.", err)
		}
	}
	return utils.OK(c, "Quiz saved successfully.", qm)
}

func (m *QuizModule) CreateQuestionController(c *fiber.Ctx) error {
	var req CreateQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.BadRequest(c, "Quiz ID query param required.", nil)
	}
	tutorID := utils.GetUserID(c)
	q, err := m.CreateQuestionRepository(quizID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.NotFound(c, "Quiz not found.", err)
		case errors.Is(err, ErrAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this quiz belongs to.", err)
		default:
			return utils.InternalError(c, "Failed to add question.", err)
		}
	}
	return utils.Created(c, "Question added successfully.", q)
}

func (m *QuizModule) DeleteQuestionController(c *fiber.Ctx) error {
	tutorID := utils.GetUserID(c)
	id, err := m.DeleteQuestionRepository(c.Params("id"), tutorID)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuestionNotFound):
			return utils.NotFound(c, "Question not found.", err)
		case errors.Is(err, ErrAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own the course this question belongs to.", err)
		default:
			return utils.InternalError(c, "Failed to delete question.", err)
		}
	}
	return utils.OK(c, "Question deleted successfully.", generic.DeleteResponse{ID: id})
}

func (m *QuizModule) GetQuestionController(c *fiber.Ctx) error {
	var req NextQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.BadRequest(c, "Quiz ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	resp, err := m.GetQuestionRepository(quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.NotFound(c, "Quiz not found.", err)
		case errors.Is(err, ErrNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in this course.", err)
		default:
			return utils.InternalError(c, "Failed to get question.", err)
		}
	}
	return utils.OK(c, "Question fetched.", resp)
}

func (m *QuizModule) CreateSubmitController(c *fiber.Ctx) error {
	var req SubmitQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.BadRequest(c, "Quiz ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	resp, err := m.SubmitQuizService(quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.NotFound(c, "Quiz not found.", err)
		case errors.Is(err, ErrNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in this course.", err)
		default:
			return utils.InternalError(c, "Failed to submit quiz.", err)
		}
	}
	return utils.OK(c, "Quiz submitted successfully.", resp)
}
