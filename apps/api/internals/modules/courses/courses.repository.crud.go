package courses

import (
	"encoding/json"
	"errors"

	"coursehunt/api/internals/utils"

	"github.com/lib/pq"
)

var (
	ErrCourseNotFound = errors.New("course not found")
	ErrNotEnrolled    = errors.New("not enrolled in this course")
	ErrAccessDenied   = errors.New("access denied")
)

func (m *CoursesModule) CreateRepository(tutorID string, req CreateCourseRequest) (*CourseCreatedResponse, error) {
	slug := utils.Slugify(req.Title)
	var resp CourseCreatedResponse
	err := m.DB.Get(&resp, `
		INSERT INTO courses (tutor_id, slug, title, short_description, category_id, subcategory_id, language, level, status, benefits, requirements)
		VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE(NULLIF($8, ''), 'all'), COALESCE(NULLIF($9, ''), 'draft'), $10, $11)
		RETURNING id, slug, title, status, created_at`,
		tutorID, slug, req.Title, req.ShortDescription, req.CategoryID, req.SubcategoryID,
		req.Language, req.Level, req.Status,
		pq.Array([]string{}), pq.Array([]string{}))
	return &resp, err
}

func (m *CoursesModule) UpdateRepository(id, tutorID string, req UpdateCourseRequest) (*Course, error) {
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
		"subcategory_id":    req.SubcategoryID,
		"coupon_allowed":    req.CouponAllowed,
		"status":            req.Status,
	}

	query := `
		WITH target_course AS (
			SELECT tutor_id FROM courses WHERE id = :id
		),
		updated AS (
			UPDATE courses SET
				title = COALESCE(:title, title),
				short_description = COALESCE(:short_description, short_description),
				long_description = COALESCE(:long_description, long_description),
				image_url = COALESCE(:image_url, image_url),
				preview_video_url = COALESCE(:preview_video_url, preview_video_url),
				language = COALESCE(:language, language),
				level = COALESCE(:level, level),
				actual_price = COALESCE(:actual_price, actual_price),
				final_price = COALESCE(:final_price, final_price),
				benefits = COALESCE(:benefits, benefits),
				requirements = COALESCE(:requirements, requirements),
				category_id = COALESCE(:category_id, category_id),
				subcategory_id = COALESCE(:subcategory_id, subcategory_id),
				coupon_allowed = COALESCE(:coupon_allowed, coupon_allowed),
				status = COALESCE(:status, status),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = :id AND tutor_id = :user_id
			RETURNING *
		)
		SELECT 
			(SELECT tutor_id FROM target_course) AS db_tutor_id,
			row_to_json(updated.*) AS updated_data
		FROM (SELECT 1) dummy
		LEFT JOIN updated ON true
	`

	stmt, err := m.DB.PrepareNamed(query)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	var result struct {
		DBTutorID   *string          `db:"db_tutor_id"`
		UpdatedData *json.RawMessage `db:"updated_data"`
	}

	if err := stmt.Get(&result, args); err != nil {
		return nil, err
	}

	switch {
	case result.DBTutorID == nil:
		return nil, ErrCourseNotFound
	case result.UpdatedData == nil:
		return nil, ErrAccessDenied
	}

	var c Course
	if err := json.Unmarshal(*result.UpdatedData, &c); err != nil {
		return nil, err
	}
	return &c, nil
}

func (m *CoursesModule) DeleteRepository(id, tutorID string) (string, error) {
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
	err := m.DB.Get(&result, query, id, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case result.DBTutorID == nil:
		return "", ErrCourseNotFound
	case result.DeletedID == nil:
		return "", ErrAccessDenied
	}

	return *result.DeletedID, nil
}
