package assignments

import (
	"context"

	"coursehunt/server/internals/utils"
)

func (a *App) CreateAssignment(ctx context.Context, lessonID string, req CreateAssignmentRequest) (*Assignment, error) {
	assignment, err := a.CreateAssignmentRepository(ctx, lessonID, req)
	if err != nil {
		return nil, utils.ErrInternal("Failed to create assignment.", err)
	}
	return assignment, nil
}

func (a *App) GetAssignmentByLesson(ctx context.Context, lessonID string) (*Assignment, error) {
	assignment, err := a.GetAssignmentByLessonRepository(ctx, lessonID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch assignment.", err)
	}
	return assignment, nil
}

func (a *App) SubmitAssignment(ctx context.Context, assignmentID, userID string, req SubmitAssignmentRequest) (*AssignmentSubmission, error) {
	submission, err := a.SubmitAssignmentRepository(ctx, assignmentID, userID, req.FileURL)
	if err != nil {
		return nil, utils.ErrInternal("Failed to submit assignment.", err)
	}
	return submission, nil
}

func (a *App) GetSubmission(ctx context.Context, assignmentID, userID string) (*AssignmentSubmission, error) {
	submission, err := a.GetSubmissionRepository(ctx, assignmentID, userID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch submission.", err)
	}
	return submission, nil
}

func (a *App) ListSubmissions(ctx context.Context, assignmentID string) ([]AssignmentSubmission, error) {
	submissions, err := a.ListSubmissionsForAssignmentRepository(ctx, assignmentID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch submissions.", err)
	}
	return submissions, nil
}

func (a *App) GradeSubmission(ctx context.Context, submissionID, graderID string, req GradeSubmissionRequest) (*AssignmentSubmission, error) {
	submission, err := a.GradeSubmissionRepository(ctx, submissionID, graderID, req)
	if err != nil {
		return nil, utils.ErrInternal("Failed to grade submission.", err)
	}
	return submission, nil
}
