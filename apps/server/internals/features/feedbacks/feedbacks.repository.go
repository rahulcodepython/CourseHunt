package feedbacks

import (
	"context"
	"errors"
	"fmt"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

type FeedbackListPayload struct {
	Total int        `json:"total"`
	Data  []Feedback `json:"data"`
}

func (a *App) CreateRepository(ctx context.Context, userID, courseID string, req CreateFeedbackRequest) (*Feedback, error) {
	var (
		isEnrolled   bool
		insertedData []byte
	)

	err := a.DB.QueryRow(ctx, CreateFeedback, courseID, userID, req.Rating, req.Content).Scan(&isEnrolled, &insertedData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrFeedbacksNotEnrolled},
		postgres.Condition{Failed: len(insertedData) == 0 || string(insertedData) == "null", Err: errors.New("failed to save feedback")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[Feedback](insertedData)
}

func (a *App) ListPinnedRepository(ctx context.Context, page, limit int, courseID string) ([]Feedback, int, error) {
	filter := postgres.NewFilter()
	filter.AddRaw("f.is_pinned = true")
	if courseID != "" {
		filter.Add("f.course_id = $%d", courseID)
	}

	limitIdx := filter.Paginate(page, limit)
	query := BuildListQuery(filter.Where(""), limitIdx)

	payload, err := postgres.QueryJSON[FeedbackListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil || payload.Data == nil {
		return []Feedback{}, 0, nil
	}
	return payload.Data, payload.Total, nil
}

func (a *App) AdminListRepository(ctx context.Context, page, limit int, isPinned, userName, userEmail, courseID string) ([]Feedback, int, error) {
	filter := postgres.NewFilter()

	if isPinned == "true" || isPinned == "false" {
		filter.AddRaw(fmt.Sprintf("f.is_pinned = %s", isPinned))
	}
	if userName != "" {
		filter.Add("u.name ILIKE $%d", "%"+userName+"%")
	}
	if userEmail != "" {
		filter.Add("u.email ILIKE $%d", "%"+userEmail+"%")
	}
	if courseID != "" {
		filter.Add("f.course_id = $%d", courseID)
	}

	limitIdx := filter.Paginate(page, limit)
	query := BuildListQuery(filter.Where(""), limitIdx)

	payload, err := postgres.QueryJSON[FeedbackListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil || payload.Data == nil {
		return []Feedback{}, 0, nil
	}
	return payload.Data, payload.Total, nil
}

func (a *App) TutorListRepository(ctx context.Context, userID string, page, limit int, isPinned, userName, userEmail, courseID string) ([]Feedback, int, error) {
	filter := postgres.NewFilter()

	filter.Add("c.tutor_id = $%d", userID)
	if isPinned == "true" || isPinned == "false" {
		filter.AddRaw(fmt.Sprintf("f.is_pinned = %s", isPinned))
	}
	if userName != "" {
		filter.Add("u.name ILIKE $%d", "%"+userName+"%")
	}
	if userEmail != "" {
		filter.Add("u.email ILIKE $%d", "%"+userEmail+"%")
	}
	if courseID != "" {
		filter.Add("f.course_id = $%d", courseID)
	}

	limitIdx := filter.Paginate(page, limit)
	query := BuildListQuery(filter.Where(""), limitIdx)

	payload, err := postgres.QueryJSON[FeedbackListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil || payload.Data == nil {
		return []Feedback{}, 0, nil
	}
	return payload.Data, payload.Total, nil
}

func (a *App) AdminUpdateRepository(ctx context.Context, id string, isPinned bool) (*Feedback, error) {
	var (
		feedbackExists bool
		updatedData    []byte
	)

	err := a.DB.QueryRow(ctx, AdminPinFeedback, id, isPinned).Scan(&feedbackExists, &updatedData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if !feedbackExists {
		return nil, generic.ErrFeedbacksFeedbackNotFound
	}

	return postgres.DecodeJSON[Feedback](updatedData)
}

func (a *App) AdminDeleteRepository(ctx context.Context, id string) (string, error) {
	var (
		feedbackExists bool
		deletedID      string
	)

	err := a.DB.QueryRow(ctx, AdminDeleteFeedback, id).Scan(&feedbackExists, &deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}

	if !feedbackExists {
		return "", generic.ErrFeedbacksFeedbackNotFound
	}

	return deletedID, nil
}

func (a *App) TutorDeleteRepository(ctx context.Context, id, userID string) (string, error) {
	var (
		feedbackExists bool
		isOwner        bool
		deletedID      string
	)

	err := a.DB.QueryRow(ctx, TutorDeleteFeedback, id, userID).Scan(&feedbackExists, &isOwner, &deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !feedbackExists, Err: generic.ErrFeedbacksFeedbackNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrCoursesAccessDenied},
	); err != nil {
		return "", err
	}

	return deletedID, nil
}
