package faqs

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/postgres"
	"coursehunt/server/internals/utils"
)

func (a *App) PublicList(ctx context.Context, courseID string) ([]Faq, error) {
	cacheKey := fmt.Sprintf("faqs:course:%s:public", courseID)
	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]Faq, error) {
		faqs, err := a.PublicListRepository(ctx, courseID)
		if err != nil {
			return nil, utils.ErrInternal("Failed to fetch FAQs.", err)
		}
		return faqs, nil
	})
}

func (a *App) AdminList(ctx context.Context, courseID string) ([]Faq, error) {
	cacheKey := fmt.Sprintf("faqs:course:%s:admin", courseID)
	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]Faq, error) {
		faqs, err := a.AdminListRepository(ctx, courseID)
		if err != nil {
			return nil, utils.ErrInternal("Failed to fetch FAQs.", err)
		}
		return faqs, nil
	})
}

func (a *App) TutorList(ctx context.Context, courseID, userID string) ([]Faq, error) {
	cacheKey := fmt.Sprintf("faqs:course:%s:tutor:%s", courseID, userID)
	res, err := cache.FetchOrNegative(ctx, a.Cache, cacheKey, 10*time.Minute, func(e error) bool {
		return errors.Is(e, generic.ErrFaqsCourseNotFound)
	}, func() ([]Faq, error) {
		faqs, err := a.TutorListRepository(ctx, courseID, userID)
		if err != nil {
			return nil, err
		}
		return faqs, nil
	})
	if err != nil {
		if errors.Is(err, generic.ErrFaqsCourseNotFound) || errors.Is(err, postgres.ErrNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrFaqsUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch FAQs.", err)
	}

	return res, nil
}

func (a *App) Create(ctx context.Context, userID, courseID string, req CreateFaqRequest) (*Faq, error) {
	req.Question = utils.SanitizeUGC(req.Question)
	req.Answer = utils.SanitizeUGC(req.Answer)
	if req.Question == "" || req.Answer == "" {
		return nil, utils.ErrBadRequest("Question and answer cannot be empty after sanitization.", nil)
	}

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

	a.Cache.Invalidate(ctx, fmt.Sprintf("faqs:course:%s*", courseID))

	return faq, nil
}

func (a *App) Update(ctx context.Context, id, userID string, req UpdateFaqRequest) (*Faq, error) {
	if req.Question != nil {
		sanitized := utils.SanitizeUGC(*req.Question)
		if sanitized == "" {
			return nil, utils.ErrBadRequest("Question cannot be empty after sanitization.", nil)
		}
		req.Question = &sanitized
	}
	if req.Answer != nil {
		sanitized := utils.SanitizeUGC(*req.Answer)
		if sanitized == "" {
			return nil, utils.ErrBadRequest("Answer cannot be empty after sanitization.", nil)
		}
		req.Answer = &sanitized
	}

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

	a.Cache.Invalidate(ctx, fmt.Sprintf("faqs:course:%s*", faq.CourseID))

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

	a.Cache.Invalidate(ctx, "faqs:course:*")

	return deletedID, nil
}
