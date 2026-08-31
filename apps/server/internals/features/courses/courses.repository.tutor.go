package courses

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

type ManageListPayload struct {
	Total int      `json:"total"`
	Data  []Course `json:"data"`
}

func (a *App) AdminListRepository(ctx context.Context, page, limit int, categoryID, subcategoryID, level, search, status, filterTutorID string) ([]Course, int, error) {
	filter := postgres.NewFilter()

	if status != "" {
		filter.Add("c.status = $%d", status)
	}

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
	if filterTutorID != "" {
		filter.Add("c.tutor_id = NULLIF($%d, '')::uuid", filterTutorID)
	}

	limitIdx := filter.Paginate(page, limit)

	result, err := postgres.QueryJSON[ManageListPayload](ctx, a.DB, BuildTutorListQuery(filter.Join("1=1"), limitIdx), filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if result == nil || result.Data == nil {
		return []Course{}, 0, nil
	}
	return result.Data, result.Total, nil
}

func (a *App) TutorListRepository(ctx context.Context, page, limit int, userID string, categoryID, subcategoryID, level, search, status string) ([]Course, int, error) {
	filter := postgres.NewFilter()

	filter.Add("c.tutor_id = NULLIF($%d, '')::uuid", userID)
	if status != "" {
		filter.Add("c.status = $%d", status)
	}

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

	result, err := postgres.QueryJSON[ManageListPayload](ctx, a.DB, BuildTutorListQuery(filter.Join("1=1"), limitIdx), filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if result == nil || result.Data == nil {
		return []Course{}, 0, nil
	}
	return result.Data, result.Total, nil
}

func (a *App) AdminGetByIDRepository(ctx context.Context, id string) (*Course, error) {
	course, err := postgres.QueryJSON[Course](ctx, a.DB, GetByID, id, "")
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if course == nil {
		return nil, generic.ErrCoursesCourseNotFound
	}
	return course, nil
}

func (a *App) TutorGetByIDRepository(ctx context.Context, id, userID string) (*Course, error) {
	course, err := postgres.QueryJSON[Course](ctx, a.DB, GetByID, id, userID)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if course == nil {
		return nil, generic.ErrCoursesCourseNotFound
	}
	return course, nil
}
