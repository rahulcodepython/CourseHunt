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

func (a *App) ListRepository(ctx context.Context, page, limit int, userID string, scope generic.AuthScope, categoryID, subcategoryID, level, search, status, filterTutorID string) ([]Course, int, error) {
	offset := (page - 1) * limit
	filter := postgres.NewFilter()

	if scope == generic.ScopeTutor {
		filter.Add("c.tutor_id = NULLIF($%d, '')::uuid", userID)
	}
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
	if scope != generic.ScopeTutor && filterTutorID != "" {
		filter.Add("c.tutor_id = NULLIF($%d, '')::uuid", filterTutorID)
	}

	limitIdx := filter.NextIdx()
	filter.AddArgs(limit, offset)

	result, err := postgres.QueryJSON[ManageListPayload](ctx, a.DB, BuildTutorListQuery(filter.Join("1=1"), limitIdx), filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []Course{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []Course{}
	}
	return result.Data, result.Total, nil
}

// GetByIDRepository fetches a single course by ID, honoring the caller's scope.
func (a *App) GetByIDRepository(ctx context.Context, id, userID string, scope generic.AuthScope) (*Course, error) {
	ownerID := ""
	if scope == generic.ScopeTutor {
		ownerID = userID
	}

	resp, err := postgres.QueryJSON[Course](ctx, a.DB, GetByID, id, ownerID)
	if err != nil {
		return nil, err
	}
	if resp == nil {
		return nil, generic.ErrCoursesCourseNotFound
	}
	return resp, nil
}
