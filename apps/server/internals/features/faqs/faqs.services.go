package faqs

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) PublicList(ctx context.Context, courseID string) ([]Faq, error) {
	faqs, err := a.PublicListRepository(ctx, courseID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch FAQs.", err)
	}
	return faqs, nil
}

func (a *App) List(ctx context.Context, courseID, userID string, scope generic.AuthScope) ([]Faq, error) {
	faqs, err := a.ListRepository(ctx, courseID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrFaqsCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch FAQs.", err)
	}

	return faqs, nil
}

func (a *App) Create(ctx context.Context, userID, courseID string, req CreateFaqRequest) (*Faq, error) {
	faq, err := a.CreateRepository(ctx, userID, courseID, req)
	if err != nil {
		if errors.Is(err, generic.ErrFaqsCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to create FAQ.", err)
	}

	a.Cache.InvalidateFaqs(ctx)

	return faq, nil
}

func (a *App) Update(ctx context.Context, id, userID string, req UpdateFaqRequest) (*Faq, error) {
	faq, err := a.UpdateRepository(ctx, id, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrFaqsFaqNotFound) {
			return nil, utils.ErrNotFound("FAQ not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to update FAQ.", err)
	}

	a.Cache.InvalidateFaqs(ctx)

	return faq, nil
}

func (a *App) Delete(ctx context.Context, id, userID string) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrFaqsFaqNotFound) {
			return "", utils.ErrNotFound("FAQ not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return "", utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return "", utils.ErrInternal("Failed to delete FAQ.", err)
	}

	a.Cache.InvalidateFaqs(ctx)

	return deletedID, nil
}
