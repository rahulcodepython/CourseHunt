package courses

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) PublicSingleRepository(ctx context.Context, slug, userID string) (*CourseLandingResponse, error) {
	resp, err := postgres.QueryJSON[CourseLandingResponse](ctx, a.DB, PublicSingle, slug, userID)
	if err != nil {
		return nil, err
	}
	if resp == nil {
		return nil, generic.ErrCoursesCourseNotFound
	}
	return resp, nil
}

type PublicListPayload struct {
	Total int                    `json:"total"`
	Data  []CoursePublicResponse `json:"data"`
}

func (a *App) PublicListRepository(ctx context.Context, page, limit int, categoryID, subcategoryID, level, search string) ([]CoursePublicResponse, int, error) {
	filter := postgres.NewFilter()
	filter.AddRaw("c.status = 'published'")

	targetCatID := categoryID
	if targetCatID == "" && subcategoryID != "" {
		targetCatID = subcategoryID
	}

	if targetCatID != "" {
		filter.Add("c.category_id = NULLIF($%d, '')::uuid", targetCatID)
	}
	if level != "" {
		filter.Add("c.level = $%d", level)
	}
	if search != "" {
		filter.Add2("(c.title ILIKE $%d OR c.short_description ILIKE $%d)", "%"+search+"%")
	}

	limitIdx := filter.Paginate(page, limit)

	result, err := postgres.QueryJSON[PublicListPayload](ctx, a.DB, BuildPublicListQuery(filter.Join(""), limitIdx), filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []CoursePublicResponse{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []CoursePublicResponse{}
	}
	return result.Data, result.Total, nil
}
