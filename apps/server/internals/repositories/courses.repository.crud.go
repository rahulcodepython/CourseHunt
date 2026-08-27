package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
	"encoding/json"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type CoursesRepository struct {
	DB              *sqlx.DB
	EnrollmentsRepo *EnrollmentsRepository
	Cache           *cache.Cache
}

func NewCoursesRepository(db *sqlx.DB, enrollmentsRepo *EnrollmentsRepository, cache *cache.Cache) *CoursesRepository {
	return &CoursesRepository{DB: db, EnrollmentsRepo: enrollmentsRepo, Cache: cache}
}

// CreateRepository scans the inserted row via row_to_json rather than a
// direct `RETURNING *` struct scan — Course.Benefits/Requirements are plain
// []string, and database/sql can't scan a raw Postgres TEXT[] driver value
// into that without going through pq.Array, which a bare struct scan doesn't
// do. JSON round-tripping (as every other course read query in this repo
// already does) sidesteps that entirely.
func (r *CoursesRepository) CreateRepository(tutorID string, req entities.CreateCourseRequest) (*entities.Course, error) {
	slug := utils.Slugify(req.Title)
	var raw []byte
	err := r.DB.Get(&raw, `
		WITH inserted AS (
			INSERT INTO courses (
				tutor_id, slug, title, short_description, long_description, image_url, preview_video_url,
				category_id, language, level, status, actual_price, final_price, benefits, requirements, coupon_allowed, is_free
			)
			VALUES (
				$1, $2, $3, $4, $5, NULLIF($6, ''), NULLIF($7, ''),
				$8, $9, COALESCE(NULLIF($10, ''), 'all'), 'draft', $11, $12, $13, $14, $15, $16
			)
			RETURNING *
		)
		SELECT row_to_json(inserted)::jsonb || jsonb_build_object('student_count', 0) FROM inserted`,
		tutorID, slug, req.Title, req.ShortDescription, req.LongDescription, req.ImageURL, req.PreviewVideoURL,
		req.CategoryID, req.Language, req.Level, req.ActualPrice, req.FinalPrice,
		pq.Array(req.Benefits), pq.Array(req.Requirements), req.CouponAllowed, req.IsFree)
	if err != nil {
		return nil, err
	}
	var resp entities.Course
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (r *CoursesRepository) UpdateRepository(id, tutorID string, req entities.UpdateCourseRequest) (*entities.Course, *entities.CourseFileCleanup, error) {
	var benefits, requirements interface{}
	if req.Benefits != nil {
		benefits = pq.Array(*req.Benefits)
	}
	if req.Requirements != nil {
		requirements = pq.Array(*req.Requirements)
	}

	args := map[string]interface{}{
		"id":                id,
		"user_id":           tutorID,
		"title":             req.Title,
		"short_description": req.ShortDescription,
		"long_description":  req.LongDescription,
		"image_url":         req.ImageURL,
		"preview_video_url": req.PreviewVideoURL,
		"language":          req.Language,
		"level":             req.Level,
		"actual_price":      req.ActualPrice,
		"final_price":       req.FinalPrice,
		"benefits":          benefits,
		"requirements":      requirements,
		"category_id":       req.CategoryID,
		"coupon_allowed":    req.CouponAllowed,
		"is_free":           req.IsFree,
		"status":            req.Status,
	}

	// image_url/preview_video_url use a three-way CASE instead of a plain
	// COALESCE: a JSON null (Go nil pointer) still means "leave untouched",
	// but an explicit empty string now means "clear this file" — COALESCE
	// alone can't express clearing a field, since COALESCE(NULL, x) is x.
	// Each bare :param is wrapped in CAST(... AS text): left uncast, Postgres
	// can't infer the parameter's type from a CASE branch that also compares
	// it to '' and NULL, and PrepareNamed fails with "could not determine
	// data type of parameter" (confirmed against a live DB before this fix).
	// target_course captures the pre-update URLs so the controller can tell
	// which S3 object (if any) was just orphaned by the change.
	query := `
		WITH target_course AS (
			SELECT tutor_id, image_url AS old_image_url, preview_video_url AS old_preview_video_url
			FROM courses WHERE id = :id
		),
		updated AS (
			UPDATE courses SET
				title = COALESCE(:title, title),
				short_description = COALESCE(:short_description, short_description),
				long_description = COALESCE(:long_description, long_description),
				image_url = CASE WHEN CAST(:image_url AS text) IS NULL THEN image_url WHEN CAST(:image_url AS text) = '' THEN NULL ELSE CAST(:image_url AS text) END,
				preview_video_url = CASE WHEN CAST(:preview_video_url AS text) IS NULL THEN preview_video_url WHEN CAST(:preview_video_url AS text) = '' THEN NULL ELSE CAST(:preview_video_url AS text) END,
				language = COALESCE(:language, language),
				level = COALESCE(:level, level),
				actual_price = COALESCE(:actual_price, actual_price),
				final_price = COALESCE(:final_price, final_price),
				benefits = COALESCE(:benefits, benefits),
				requirements = COALESCE(:requirements, requirements),
				category_id = COALESCE(:category_id, category_id),
				coupon_allowed = COALESCE(:coupon_allowed, coupon_allowed),
				is_free = COALESCE(:is_free, is_free),
				status = COALESCE(:status, status),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = :id AND tutor_id = :user_id
			RETURNING *
		)
		SELECT
			(SELECT tutor_id FROM target_course) AS db_tutor_id,
			(SELECT old_image_url FROM target_course) AS old_image_url,
			(SELECT old_preview_video_url FROM target_course) AS old_preview_video_url,
			(
				SELECT row_to_json(u) FROM (
					SELECT updated.*, (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = updated.id AND e.revoked = false) AS student_count
					FROM updated
				) u
			) AS updated_data
		FROM (SELECT 1) dummy
		LEFT JOIN updated ON true
	`

	stmt, err := r.DB.PrepareNamed(query)
	if err != nil {
		return nil, nil, err
	}
	defer stmt.Close()

	var result struct {
		DBTutorID          *string          `db:"db_tutor_id"`
		OldImageURL        *string          `db:"old_image_url"`
		OldPreviewVideoURL *string          `db:"old_preview_video_url"`
		UpdatedData        *json.RawMessage `db:"updated_data"`
	}

	if err := stmt.Get(&result, args); err != nil {
		return nil, nil, err
	}

	switch {
	case result.DBTutorID == nil:
		return nil, nil, generic.ErrCoursesCourseNotFound
	case result.UpdatedData == nil:
		return nil, nil, generic.ErrCoursesAccessDenied
	}

	var c entities.Course
	if err := json.Unmarshal(*result.UpdatedData, &c); err != nil {
		return nil, nil, err
	}
	cleanup := &entities.CourseFileCleanup{
		OldImageURL:        result.OldImageURL,
		OldPreviewVideoURL: result.OldPreviewVideoURL,
	}
	return &c, cleanup, nil
}

func (r *CoursesRepository) DeleteRepository(id, tutorID string) (string, error) {
	var result struct {
		DBTutorID *string `db:"db_tutor_id"`
		DeletedID *string `db:"deleted_id"`
	}

	query := `
		WITH target_course AS (
			SELECT tutor_id FROM courses WHERE id = $1
		),
		deleted AS (
			DELETE FROM courses WHERE id = $1 AND tutor_id = $2
			RETURNING id
		)
		SELECT 
			(SELECT tutor_id FROM target_course) AS db_tutor_id,
			(SELECT id FROM deleted) AS deleted_id
	`
	err := r.DB.Get(&result, query, id, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case result.DBTutorID == nil:
		return "", generic.ErrCoursesCourseNotFound
	case result.DeletedID == nil:
		return "", generic.ErrCoursesAccessDenied
	}

	return *result.DeletedID, nil
}
