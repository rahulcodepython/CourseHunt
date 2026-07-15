package quiz

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *QuizModule) CreateMetadataController(c *fiber.Ctx) error {
	var req CreateQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Lesson ID query param required.", nil, nil)
	}
	tutorID := utils.GetUserID(c)
	qm, err := m.CreateMetadataRepository(lessonID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own the course this lesson belongs to.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to save quiz metadata.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusOK, true, "Quiz saved successfully.", qm, nil)
}

func (m *QuizModule) CreateQuestionController(c *fiber.Ctx) error {
	var req CreateQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Quiz ID query param required.", nil, nil)
	}
	tutorID := utils.GetUserID(c)
	q, err := m.CreateQuestionRepository(quizID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Quiz not found.", nil, err.Error())
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own the course this quiz belongs to.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to add question.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusCreated, true, "Question added successfully.", q, nil)
}

func (m *QuizModule) DeleteQuestionController(c *fiber.Ctx) error {
	tutorID := utils.GetUserID(c)
	id, err := m.DeleteQuestionRepository(c.Params("id"), tutorID)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuestionNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Question not found.", nil, err.Error())
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own the course this question belongs to.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete question.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusOK, true, "Question deleted successfully.", models.DeleteResponse{ID: id}, nil)
}

func (m *QuizModule) GetQuestionController(c *fiber.Ctx) error {
	var req NextQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Quiz ID query param required.", nil, nil)
	}
	userID := utils.GetUserID(c)
	resp, err := m.GetQuestionRepository(quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Quiz not found.", nil, err.Error())
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in this course.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to get question.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusOK, true, "Question fetched.", resp, nil)
}

func (m *QuizModule) CreateSubmitController(c *fiber.Ctx) error {
	var req SubmitQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Quiz ID query param required.", nil, nil)
	}
	userID := utils.GetUserID(c)
	resp, err := m.SubmitQuizService(quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Quiz not found.", nil, err.Error())
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in this course.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to submit quiz.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusOK, true, "Quiz submitted successfully.", resp, nil)
}
