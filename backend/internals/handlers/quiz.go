package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type QuizHandler struct{ Svc *services.QuizService }

func NewQuizHandler() *QuizHandler { return &QuizHandler{Svc: services.NewQuizService()} }

// POST /api/lessons/:lessonID/quiz  — create or update quiz metadata
func (h *QuizHandler) CreateMetadata(c *fiber.Ctx) error {
	var req models.CreateQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	qm, err := h.Svc.CreateMetadata(c.Params("lessonID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to save quiz", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "quiz saved successfully", qm, nil)
}

// POST /api/quiz/:quizID/questions
func (h *QuizHandler) AddQuestion(c *fiber.Ctx) error {
	var req models.CreateQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	q, err := h.Svc.AddQuestion(c.Params("quizID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to add question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "question added successfully", q, nil)
}

// DELETE /api/quiz/questions/:id
func (h *QuizHandler) DeleteQuestion(c *fiber.Ctx) error {
	if err := h.Svc.DeleteQuestion(c.Params("id")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "question deleted successfully", nil, nil)
}

// POST /api/lessons/:lessonID/quiz/start
func (h *QuizHandler) StartAttempt(c *fiber.Ctx) error {
	// Retrieve quiz metadata by lesson ID to get quiz ID
	qm, err := h.Svc.Repo.GetMetadataByLesson(c.Params("lessonID"))
	if err != nil {
		return utils.JSON(c, http.StatusNotFound, false, "quiz not found for this lesson", nil, nil)
	}
	attempt, err := h.Svc.StartAttempt(qm.ID, getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to start quiz attempt", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "quiz attempt started", attempt, nil)
}

// POST /api/lessons/:lessonID/quiz/next
func (h *QuizHandler) NextQuestion(c *fiber.Ctx) error {
	var req models.NextQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := h.Svc.NextQuestion(c.Params("lessonID"), getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to get next question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "next question fetched", resp, nil)
}

// POST /api/lessons/:lessonID/quiz/submit
func (h *QuizHandler) Submit(c *fiber.Ctx) error {
	var req models.SubmitQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := h.Svc.Submit(c.Params("lessonID"), getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to submit quiz", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "quiz submitted successfully", resp, nil)
}
