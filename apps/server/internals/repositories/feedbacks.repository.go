package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

type FeedbacksRepository struct {
	DB              *sqlx.DB
	EnrollmentsRepo *EnrollmentsRepository
	CoursesRepo     *CoursesRepository
	Cache           *cache.Cache
}

func NewFeedbacksRepository(db *sqlx.DB, enrollmentsRepo *EnrollmentsRepository, coursesRepo *CoursesRepository, cache *cache.Cache) *FeedbacksRepository {
	return &FeedbacksRepository{DB: db, EnrollmentsRepo: enrollmentsRepo, CoursesRepo: coursesRepo, Cache: cache}
}

func (r *FeedbacksRepository) CreateRepository(userID, courseID string, req entities.CreateFeedbackRequest) (*entities.Feedback, error) {
	var result struct {
		IsEnrolled   bool             `db:"is_enrolled"`
		InsertedData *json.RawMessage `db:"inserted_data"`
	}

	err := r.DB.Get(&result, `
		WITH course_auth AS (
			SELECT EXISTS(
				SELECT 1 FROM enrollments WHERE user_id = $2 AND course_id = $1 AND revoked = false
			) AS is_enrolled
		),
		inserted AS (
			INSERT INTO feedbacks (course_id, user_id, rating, content)
			SELECT $1, $2, $3, $4
			FROM course_auth
			WHERE is_enrolled = true
			ON CONFLICT (course_id, user_id) DO UPDATE SET rating = $3, content = $4
			RETURNING *
		),
		formatted AS (
			SELECT i.id, i.rating, i.content, i.is_pinned, i.created_at,
				   json_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS "user"
			FROM inserted i
			JOIN "users" u ON u.id = i.user_id
			LEFT JOIN courses c ON c.id = i.course_id
		),
		notified AS (
			INSERT INTO notifications (type, message, is_admin, is_tutor, is_student)
			SELECT 'feedback', COALESCE(u.name, u.email) || ' left feedback on ' || COALESCE(c.title, 'a course'), true, true, false
			FROM inserted i
			JOIN "users" u ON u.id = i.user_id
			LEFT JOIN courses c ON c.id = i.course_id
		)
		SELECT
			(SELECT is_enrolled FROM course_auth) AS is_enrolled,
			(SELECT row_to_json(formatted.*) FROM formatted) AS inserted_data
	`, courseID, userID, req.Rating, req.Content)

	if err != nil {
		return nil, err
	}

	switch {
	case !result.IsEnrolled:
		return nil, generic.ErrFeedbacksNotEnrolled
	case result.InsertedData == nil:
		return nil, errors.New("failed to save feedback")
	}

	var f entities.Feedback
	if err := json.Unmarshal(*result.InsertedData, &f); err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *FeedbacksRepository) ListRepository(scope generic.AuthScope, userID string, page, limit int, isPinned, userName, userEmail, courseID string) ([]entities.Feedback, int, error) {
	offset := (page - 1) * limit

	var where []string
	var args []any
	idx := 1

	if isPinned == "true" {
		where = append(where, "f.is_pinned = true")
	} else if isPinned == "false" {
		where = append(where, "f.is_pinned = false")
	}
	if userName != "" {
		where = append(where, fmt.Sprintf("u.name ILIKE $%d", idx))
		args = append(args, "%"+userName+"%")
		idx++
	}
	if userEmail != "" {
		where = append(where, fmt.Sprintf("u.email ILIKE $%d", idx))
		args = append(args, "%"+userEmail+"%")
		idx++
	}
	if courseID != "" {
		where = append(where, fmt.Sprintf("f.course_id = $%d", idx))
		args = append(args, courseID)
		idx++
	}
	if scope == generic.ScopeTutor {
		where = append(where, fmt.Sprintf("c.tutor_id = $%d", idx))
		args = append(args, userID)
		idx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	args = append(args, limit, offset)

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}
	err := r.DB.Get(&result, fmt.Sprintf(`
		WITH count_cte AS (
			SELECT COUNT(*) AS total
			FROM feedbacks f
			JOIN "users" u ON u.id = f.user_id
			LEFT JOIN courses c ON c.id = f.course_id
			%s
		),
		data_cte AS (
			SELECT f.id, f.rating, f.content, f.is_pinned, f.created_at,
				   json_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS "user"
			FROM feedbacks f
			JOIN "users" u ON u.id = f.user_id
			LEFT JOIN courses c ON c.id = f.course_id
			%s
			ORDER BY f.is_pinned DESC, f.created_at DESC
			LIMIT $%d OFFSET $%d
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, whereClause, whereClause, idx, idx+1), args...)
	if err != nil {
		return nil, 0, err
	}

	var list []entities.Feedback
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}

func (r *FeedbacksRepository) UpdateRepository(id string, pin bool) (*entities.Feedback, error) {
	var resultData json.RawMessage
	err := r.DB.Get(&resultData, `
		WITH updated AS (
			UPDATE feedbacks SET is_pinned = $1 WHERE id = $2 RETURNING *
		)
		SELECT row_to_json(formatted.*)
		FROM (
			SELECT u.id, u.rating, u.content, u.is_pinned, u.created_at,
				   json_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   json_build_object('id', usr.id, 'name', COALESCE(usr.name, ''), 'image', usr.image) AS "user"
			FROM updated u
			JOIN "users" usr ON usr.id = u.user_id
			LEFT JOIN courses c ON c.id = u.course_id
		) formatted`, pin, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, generic.ErrFeedbacksFeedbackNotFound
		}
		return nil, err
	}

	var f entities.Feedback
	if err := json.Unmarshal(resultData, &f); err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *FeedbacksRepository) DeleteRepository(id, userID string, scope generic.AuthScope) (string, error) {
	var result struct {
		CourseFound bool   `db:"course_found"`
		IsOwner     bool   `db:"is_owner"`
		DeletedID   string `db:"deleted_id"`
	}

	err := r.DB.Get(&result, `
		WITH feedback_course AS (
			SELECT c.tutor_id
			FROM feedbacks f
			JOIN courses c ON c.id = f.course_id
			WHERE f.id = $1
		),
		deleted AS (
			DELETE FROM feedbacks f
			USING feedback_course fc
			WHERE f.id = $1 AND (fc.tutor_id = $2 OR $3 = 'admin')
			RETURNING f.id
		)
		SELECT
			EXISTS(SELECT 1 FROM feedback_course) AS course_found,
			EXISTS(SELECT 1 FROM feedback_course WHERE tutor_id = $2) AS is_owner,
			COALESCE((SELECT id::text FROM deleted), '') AS deleted_id
	`, id, userID, string(scope))
	if err != nil {
		return "", err
	}

	switch {
	case !result.CourseFound:
		return "", generic.ErrFeedbacksFeedbackNotFound
	case result.DeletedID == "":
		return "", errors.New("access denied: you are not the tutor of this course")
	}

	return result.DeletedID, nil
}
