package quiz

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleCreateMetadata(c *fiber.Ctx) error {
	var req CreateQuizRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.ErrBadRequest("Lesson ID query param required.", nil)
	}

	qm, err := a.CreateMetadata(c.Context(), lessonID, middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Quiz saved successfully.", qm)
}

func (a *App) handleReadMetadata(c *fiber.Ctx) error {
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.ErrBadRequest("Lesson ID query param required.", nil)
	}
	userID := middlewares.UserID(c)
	scope := middlewares.ResolveScope(c)

	qm, err := a.ReadMetadata(c.Context(), lessonID, userID, scope)
	if err != nil {
		return err
	}
	return utils.OK(c, "Quiz metadata fetched.", qm)
}

func (a *App) handleListQuestions(c *fiber.Ctx) error {
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.ErrBadRequest("Quiz ID query param required.", nil)
	}
	userID := middlewares.UserID(c)
	scope := middlewares.ResolveScope(c)

	questions, err := a.ListQuestions(c.Context(), quizID, userID, scope)
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
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.ErrBadRequest("Quiz ID query param required.", nil)
	}

	q, err := a.CreateQuestion(c.Context(), quizID, middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Question added successfully.", q)
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

func (a *App) handleGetQuestion(c *fiber.Ctx) error {
	var req NextQuestionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.ErrBadRequest("Quiz ID query param required.", nil)
	}

	resp, err := a.GetQuestion(c.Context(), quizID, middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Question fetched.", resp)
}

func (a *App) handleCreateSubmit(c *fiber.Ctx) error {
	var req SubmitQuizRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.ErrBadRequest("Quiz ID query param required.", nil)
	}

	resp, err := a.Submit(c.Context(), quizID, middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Quiz submitted successfully.", resp)
}

func (a *App) handleListAttempts(c *fiber.Ctx) error {
	quizID := c.Query("quiz_id")
	if quizID == "" {
		return utils.ErrBadRequest("Quiz ID query param required.", nil)
	}

	attempts, err := a.ListAttempts(c.Context(), quizID, middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "Quiz attempts fetched.", attempts)
}

func (a *App) handleGetAttemptDetail(c *fiber.Ctx) error {
	detail, err := a.GetAttemptDetail(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "Quiz attempt fetched.", detail)
}
