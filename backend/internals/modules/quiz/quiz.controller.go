package quiz

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// POST /api/v1/quiz/metadata  — create or update quiz metadata
// @Summary CreateMetadataController
// @Description CreateMetadataController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param lesson_id query string true "lesson_id"
// @Param body body quiz.CreateQuizRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[QuizMetadata]
// @Router /api/v1/quiz/metadata [post]
func (m *QuizModule) CreateMetadataController(c *fiber.Ctx) error {
	var req CreateQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "lesson_id query param required", nil, nil)
	}
	tutorID := utils.GetUserID(c)
	qm, err := m.CreateMetadataRepository(lessonID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own the course this lesson belongs to", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to save quiz metadata", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "quiz saved successfully", qm, nil)
}

// POST /api/v1/quiz/questions
// @Summary CreateQuestionController
// @Description CreateQuestionController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param quiz_id query string true "quiz_id"
// @Param body body quiz.CreateQuestionRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[QuizQuestion]
// @Router /api/v1/quiz/questions [post]
func (m *QuizModule) CreateQuestionController(c *fiber.Ctx) error {
	var req CreateQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "quiz_id query param required", nil, nil)
	}
	tutorID := utils.GetUserID(c)
	q, err := m.CreateQuestionRepository(quizID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "quiz not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own the course this quiz belongs to", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to add question", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusCreated, true, "question added successfully", q, nil)
}

// DELETE /api/v1/quiz/questions/:id
// @Summary DeleteQuestionController
// @Description DeleteQuestionController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/quiz/questions/{id} [delete]
func (m *QuizModule) DeleteQuestionController(c *fiber.Ctx) error {
	tutorID := utils.GetUserID(c)
	id, err := m.DeleteQuestionRepository(c.Params("id"), tutorID)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuestionNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "question not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own the course this question belongs to", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete question", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "question deleted successfully", map[string]string{"id": id}, nil)
}

// POST /api/v1/quiz/question
// @Summary GetQuestionController
// @Description GetQuestionController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param quiz_id query string true "quiz_id"
// @Param body body quiz.NextQuestionRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[NextQuestionResponse]
// @Router /api/v1/quiz/question [post]
func (m *QuizModule) GetQuestionController(c *fiber.Ctx) error {
	var req NextQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "quiz_id query param required", nil, nil)
	}
	userID := utils.GetUserID(c)
	resp, err := m.GetQuestionRepository(quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "quiz not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: not enrolled in this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to get question", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "question fetched", resp, nil)
}

// POST /api/v1/quiz/submit
// @Summary CreateSubmitController
// @Description CreateSubmitController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param quiz_id query string true "quiz_id"
// @Param body body quiz.SubmitQuizRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[SubmitQuizResponse]
// @Router /api/v1/quiz/submit [post]
func (m *QuizModule) CreateSubmitController(c *fiber.Ctx) error {
	var req SubmitQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "quiz_id query param required", nil, nil)
	}
	userID := utils.GetUserID(c)
	resp, err := m.SubmitQuizService(quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrQuizNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "quiz not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: not enrolled in this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to submit quiz", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "quiz submitted successfully", resp, nil)
}
