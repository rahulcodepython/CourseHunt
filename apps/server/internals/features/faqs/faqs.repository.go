package faqs

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

var (
	faqCourseErrMap = postgres.StatusErrorMap{
		0: generic.ErrFaqsCourseNotFound,
		1: generic.ErrFaqsUnauthorized,
	}
	faqItemErrMap = postgres.StatusErrorMap{
		0: generic.ErrFaqsFaqNotFound,
		1: generic.ErrFaqsUnauthorized,
	}
)

func (a *App) ListRepository(ctx context.Context, courseID, userID string, scope generic.AuthScope) ([]Faq, error) {
	if scope == generic.ScopeAdmin {
		return postgres.QueryJSONSlice[Faq](ctx, a.DB, ListAdmin, courseID)
	}
	return postgres.QuerySliceWithStatus[Faq](ctx, a.DB, ListScoped, faqCourseErrMap, courseID, userID)
}

func (a *App) PublicListRepository(ctx context.Context, courseID string) ([]Faq, error) {
	return postgres.QueryJSONSlice[Faq](ctx, a.DB, PublicList, courseID)
}

func (a *App) CreateRepository(ctx context.Context, userID, courseID string, req CreateFaqRequest) (*Faq, error) {
	return postgres.QueryWithStatus[Faq](
		ctx,
		a.DB,
		CreateFaq,
		faqCourseErrMap,
		courseID, userID, req.Question, req.Answer,
	)
}

func (a *App) UpdateRepository(ctx context.Context, id, userID string, req UpdateFaqRequest) (*Faq, error) {
	return postgres.QueryWithStatus[Faq](
		ctx,
		a.DB,
		UpdateFaq,
		faqItemErrMap,
		id, userID, req.Question, req.Answer,
	)
}

func (a *App) DeleteRepository(ctx context.Context, id, userID string) (string, error) {
	return postgres.QueryIDWithStatus(
		ctx,
		a.DB,
		DeleteFaq,
		faqItemErrMap,
		id, userID,
	)
}
