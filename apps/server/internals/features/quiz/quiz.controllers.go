package quiz

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// --- Admin Handlers ---

func (a *App) handleAdminReadMetadata(c *fiber.Ctx) error {
	lessonID, err := utils.RequireQuery(c, "lesson_id", "Lesson ID")
	if err != nil {
		return err
	}

	qm, err := a.AdminReadMetadata(c.Context(), lessonID)
	if err != nil {
		return err
	}
	return utils.OK(c, "Quiz metadata fetched.", qm)
}

func (a *App) handleAdminListQuestions(c *fiber.Ctx) error {
	quizID, err := utils.RequireQuery(c, "quiz_id", "Quiz ID")
	if err != nil {
		return err
	}

	questions, err := a.AdminListQuestions(c.Context(), quizID)
	if err != nil {
		return err
	}
	return utils.OK(c, "Questions fetched.", questions)
}

// --- Tutor Handlers ---

func (a *App) handleCreateMetadata(c *fiber.Ctx) error {
	var req CreateQuizRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	lessonID, err := utils.RequireQuery(c, "lesson_id", "Lesson ID")
	if err != nil {
		return err
	}

	qm, err := a.CreateMetadata(c.Context(), lessonID, middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Quiz saved successfully.", qm)
}

func (a *App) handleTutorReadMetadata(c *fiber.Ctx) error {
	lessonID, err := utils.RequireQuery(c, "lesson_id", "Lesson ID")
	if err != nil {
		return err
	}
	userID := middlewares.UserID(c)

	qm, err := a.TutorReadMetadata(c.Context(), lessonID, userID)
	if err != nil {
		return err
	}
	return utils.OK(c, "Quiz metadata fetched.", qm)
}

func (a *App) handleTutorListQuestions(c *fiber.Ctx) error {
	quizID, err := utils.RequireQuery(c, "quiz_id", "Quiz ID")
	if err != nil {
		return err
	}
	userID := middlewares.UserID(c)

	questions, err := a.TutorListQuestions(c.Context(), quizID, userID)
	if err != nil {
		return err
	}
	return utils.OK(c, "Questions fetched.", questions)
}

func (a *App) handleCreateQuestion(c *fiber.Ctx) error {
	var req CreateQuestionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	quizID, err := utils.RequireQuery(c, "quiz_id", "Quiz ID")
	if err != nil {
		return err
	}

	q, err := a.CreateQuestion(c.Context(), quizID, middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Question created successfully.", q)
}

func (a *App) handleUpdateQuestion(c *fiber.Ctx) error {
	var req CreateQuestionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	q, err := a.UpdateQuestion(c.Context(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Question updated successfully.", q)
}

func (a *App) handleDeleteQuestion(c *fiber.Ctx) error {
	id, err := a.DeleteQuestion(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Question deleted successfully.", generic.DeleteResponse{ID: id})
}

// --- Student Taking Handlers ---

func (a *App) handleGetQuestion(c *fiber.Ctx) error {
	var req NextQuestionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	quizID, err := utils.RequireQuery(c, "quiz_id", "Quiz ID")
	if err != nil {
		return err
	}

	q, err := a.GetQuestion(c.Context(), quizID, middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Question fetched.", q)
}

func (a *App) handleCreateSubmit(c *fiber.Ctx) error {
	var req SubmitQuizRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	quizID, err := utils.RequireQuery(c, "quiz_id", "Quiz ID")
	if err != nil {
		return err
	}

	resp, err := a.Submit(c.Context(), quizID, middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.Created(c, generic.MsgQuizSubmitted, resp)
}

func (a *App) handleListAttempts(c *fiber.Ctx) error {
	quizID, err := utils.RequireQuery(c, "quiz_id", "Quiz ID")
	if err != nil {
		return err
	}

	attempts, err := a.ListAttempts(c.Context(), quizID, middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Attempts fetched.", attempts)
}

func (a *App) handleGetAttemptDetail(c *fiber.Ctx) error {
	detail, err := a.GetAttemptDetail(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Attempt detail fetched.", detail)
}
