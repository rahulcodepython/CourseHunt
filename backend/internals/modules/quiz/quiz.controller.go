package quiz

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// POST /api/lessons/:lessonID/quiz  — create or update quiz metadata
func (m *QuizModule) CreateMetadataController(c *fiber.Ctx) error {
	var req CreateQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	qm, err := m.CreateMetadataService(c.Params("lessonID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to save quiz", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "quiz saved successfully", qm, nil)
}

// POST /api/quiz/:quizID/questions
func (m *QuizModule) CreateQuestionController(c *fiber.Ctx) error {
	var req CreateQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	q, err := m.CreateQuestionService(c.Params("quizID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to add question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "question added successfully", q, nil)
}

// DELETE /api/quiz/questions/:id
func (m *QuizModule) DeleteQuestionController(c *fiber.Ctx) error {
	id, err := m.DeleteQuestionService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "question deleted successfully", map[string]string{"id": id}, nil)
}

// POST /api/lessons/:lessonID/quiz/start
func (m *QuizModule) CreateAttemptController(c *fiber.Ctx) error {
	// Retrieve quiz metadata by lesson ID to get quiz ID
	qm, err := m.ReadMetadataRepository(c.Params("lessonID"))
	if err != nil {
		return utils.JSON(c, http.StatusNotFound, false, "quiz not found for this lesson", nil, nil)
	}
	attempt, err := m.CreateAttemptService(qm.ID, utils.GetUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to start quiz attempt", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "quiz attempt started", attempt, nil)
}

// POST /api/lessons/:lessonID/quiz/next
func (m *QuizModule) ReadNextQuestionController(c *fiber.Ctx) error {
	var req NextQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := m.NextQuestionService(c.Params("lessonID"), utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to get next question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "next question fetched", resp, nil)
}

// POST /api/lessons/:lessonID/quiz/submit
func (m *QuizModule) CreateSubmitController(c *fiber.Ctx) error {
	var req SubmitQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := m.SubmitService(c.Params("lessonID"), utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to submit quiz", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "quiz submitted successfully", resp, nil)
}
