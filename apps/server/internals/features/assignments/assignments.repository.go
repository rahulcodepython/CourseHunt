package assignments

import (
	"context"

	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) CreateAssignmentRepository(ctx context.Context, lessonID string, req CreateAssignmentRequest) (*Assignment, error) {
	return postgres.QueryJSON[Assignment](ctx, a.DB, CreateAssignment, lessonID, req.Title, req.Instructions, req.MaxScore)
}

func (a *App) GetAssignmentByLessonRepository(ctx context.Context, lessonID string) (*Assignment, error) {
	return postgres.QueryJSON[Assignment](ctx, a.DB, GetAssignmentByLesson, lessonID)
}

func (a *App) SubmitAssignmentRepository(ctx context.Context, assignmentID, userID, fileURL string) (*AssignmentSubmission, error) {
	return postgres.QueryJSON[AssignmentSubmission](ctx, a.DB, SubmitAssignment, assignmentID, userID, fileURL)
}

func (a *App) GetSubmissionRepository(ctx context.Context, assignmentID, userID string) (*AssignmentSubmission, error) {
	return postgres.QueryJSON[AssignmentSubmission](ctx, a.DB, GetSubmission, assignmentID, userID)
}

func (a *App) ListSubmissionsForAssignmentRepository(ctx context.Context, assignmentID string) ([]AssignmentSubmission, error) {
	return postgres.QueryJSONSlice[AssignmentSubmission](ctx, a.DB, ListSubmissionsForAssignment, assignmentID)
}

func (a *App) GradeSubmissionRepository(ctx context.Context, submissionID, graderID string, req GradeSubmissionRequest) (*AssignmentSubmission, error) {
	return postgres.QueryJSON[AssignmentSubmission](ctx, a.DB, GradeSubmission, submissionID, req.Score, req.FeedbackNotes, graderID)
}
