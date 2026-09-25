package assignments

import (
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleCreateAssignment(c *fiber.Ctx) error {
	var req CreateAssignmentRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	assignment, err := a.CreateAssignment(c.UserContext(), c.Params("id"), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Assignment created successfully.", assignment)
}

func (a *App) handleGetAssignment(c *fiber.Ctx) error {
	assignment, err := a.GetAssignmentByLesson(c.UserContext(), c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Assignment fetched successfully.", assignment)
}

func (a *App) handleSubmitAssignment(c *fiber.Ctx) error {
	var req SubmitAssignmentRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	submission, err := a.SubmitAssignment(c.UserContext(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Assignment submitted successfully.", submission)
}

func (a *App) handleGetSubmission(c *fiber.Ctx) error {
	submission, err := a.GetSubmission(c.UserContext(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Submission fetched successfully.", submission)
}

func (a *App) handleListSubmissions(c *fiber.Ctx) error {
	submissions, err := a.ListSubmissions(c.UserContext(), c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Submissions fetched successfully.", submissions)
}

func (a *App) handleGradeSubmission(c *fiber.Ctx) error {
	var req GradeSubmissionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	submission, err := a.GradeSubmission(c.UserContext(), c.Params("id"), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Submission graded successfully.", submission)
}
