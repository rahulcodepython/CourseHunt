package courses

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) AdminListRepository(ctx context.Context, page, limit int, categoryID, subcategoryID, level, search, status, filterTutorID string) ([]AdminCourseItem, int, error) {
	filter := postgres.NewFilter()

	if status != "" {
		filter.AddCondition("c.status = $%d", status)
	}

	targetCatID := categoryID
	if targetCatID == "" && subcategoryID != "" {
		targetCatID = subcategoryID
	}
	if targetCatID != "" {
		filter.AddCondition("c.category_id = NULLIF($%d, '')::uuid", targetCatID)
	}
	if level != "" {
		filter.AddCondition("c.level = $%d", level)
	}
	if search != "" {
		filter.AddWithReusedArg("(c.title ILIKE $%d OR c.short_description ILIKE $%d)", "%"+search+"%")
	}
	if filterTutorID != "" {
		filter.AddCondition("c.tutor_id = NULLIF($%d, '')::uuid", filterTutorID)
	}

	limitIdx := filter.Paginate(page, limit)

	result, err := postgres.QueryJSON[AdminListPayload](ctx, a.DB, BuildAdminListQuery(filter.Join("1=1"), limitIdx), filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if result == nil || result.Data == nil {
		return []AdminCourseItem{}, 0, nil
	}
	return result.Data, result.Total, nil
}

func (a *App) TutorListRepository(ctx context.Context, page, limit int, userID string, categoryID, subcategoryID, level, search, status string) ([]Course, int, error) {
	filter := postgres.NewFilter()

	filter.AddCondition("c.tutor_id = NULLIF($%d, '')::uuid", userID)
	if status != "" {
		filter.AddCondition("c.status = $%d", status)
	}

	targetCatID := categoryID
	if targetCatID == "" && subcategoryID != "" {
		targetCatID = subcategoryID
	}
	if targetCatID != "" {
		filter.AddCondition("c.category_id = NULLIF($%d, '')::uuid", targetCatID)
	}
	if level != "" {
		filter.AddCondition("c.level = $%d", level)
	}
	if search != "" {
		filter.AddWithReusedArg("(c.title ILIKE $%d OR c.short_description ILIKE $%d)", "%"+search+"%")
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

func (a *App) AdminGetByIDRepository(ctx context.Context, id string) (*AdminCourseDetail, error) {
	course, err := postgres.QueryJSON[AdminCourseDetail](ctx, a.DB, AdminGetByID, id)
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

func (a *App) ListAdminCourseOptions(ctx context.Context) ([]CourseOption, error) {
	return postgres.QueryJSONSlice[CourseOption](ctx, a.DB, AdminCourseOptions)
}

func (a *App) ListTutorCourseOptions(ctx context.Context, tutorID string) ([]CourseOption, error) {
	return postgres.QueryJSONSlice[CourseOption](ctx, a.DB, TutorCourseOptions, tutorID)
}

func (a *App) GetCourseSummary(ctx context.Context, courseID string) (*CourseSummary, error) {
	summary, err := postgres.QueryJSON[CourseSummary](ctx, a.DB, CourseSummaryQuery, courseID)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if summary == nil {
		return nil, generic.ErrCoursesCourseNotFound
	}
	return summary, nil
}

func (a *App) GetCourseAnalyticsRepository(ctx context.Context, courseID string) (*CourseAnalyticsResponse, error) {
	analytics, err := postgres.QueryJSON[CourseAnalyticsResponse](ctx, a.DB, CourseAnalyticsQuery, courseID)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if analytics == nil {
		return &CourseAnalyticsResponse{
			DailySales:   []DailySalesPoint{},
			MonthlySales: []MonthlySalesPoint{},
		}, nil
	}
	return analytics, nil
}
