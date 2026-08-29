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

func (a *App) ListRepository(ctx context.Context, scope generic.AuthScope, userID string, page, limit int, isPinned, userName, userEmail, courseID string) ([]Feedback, int, error) {
	offset := (page - 1) * limit
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
	if scope == generic.ScopeTutor {
		filter.Add("c.tutor_id = $%d", userID)
	}

	limitIdx := filter.NextIdx()
	filter.AddArgs(limit, offset)

	query := BuildListQuery(filter.Where(""), limitIdx)

	result, err := postgres.QueryJSON[FeedbackListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []Feedback{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []Feedback{}
	}
	return result.Data, result.Total, nil
}

func (a *App) UpdateRepository(ctx context.Context, id string, pin bool) (*Feedback, error) {
	f, err := postgres.QueryJSON[Feedback](ctx, a.DB, UpdateFeedbackPin, pin, id)
	if err != nil {
		return nil, generic.ErrFeedbacksFeedbackNotFound
	}
	if f == nil {
		return nil, generic.ErrFeedbacksFeedbackNotFound
	}
	return f, nil
}

func (a *App) DeleteRepository(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	var (
		courseFound bool
		isOwner     bool
		deletedID   string
	)

	err := a.DB.QueryRow(ctx, DeleteFeedback, id, userID, string(scope)).Scan(&courseFound, &isOwner, &deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !courseFound, Err: generic.ErrFeedbacksFeedbackNotFound},
		postgres.Condition{Failed: deletedID == "", Err: errors.New("access denied: you are not the tutor of this course")},
	); err != nil {
		return "", err
	}

	return deletedID, nil
}
