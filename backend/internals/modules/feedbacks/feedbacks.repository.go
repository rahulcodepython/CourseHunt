package feedbacks

import (
	"database/sql"
	"encoding/json"
	"errors"
)

var (
	ErrNotEnrolled      = errors.New("access denied: not enrolled in course")
	ErrFeedbackNotFound = errors.New("feedback not found")
)

func (m *FeedbacksModule) CreateRepository(userID, courseID string, req CreateFeedbackRequest) (*Feedback, error) {
	var result struct {
		IsEnrolled   bool             `db:"is_enrolled"`
		InsertedData *json.RawMessage `db:"inserted_data"`
	}

	err := m.DB.Get(&result, `
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
			JOIN "user" u ON u.id = i.user_id
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
		return nil, ErrNotEnrolled
	case result.InsertedData == nil:
		return nil, errors.New("failed to save feedback")
	}

	var f Feedback
	if err := json.Unmarshal(*result.InsertedData, &f); err != nil {
		return nil, err
	}
	return &f, nil
}

func (m *FeedbacksModule) ListRepository(page, limit int) ([]Feedback, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}
	err := m.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM feedbacks
		),
		data_cte AS (
			SELECT f.id, f.rating, f.content, f.is_pinned, f.created_at,
				   json_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS "user"
			FROM feedbacks f
			JOIN "user" u ON u.id = f.user_id
			LEFT JOIN courses c ON c.id = f.course_id
			ORDER BY f.is_pinned DESC, f.created_at DESC
			LIMIT $1 OFFSET $2
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []Feedback
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}

func (m *FeedbacksModule) ListPinRepository() ([]Feedback, error) {
	var resultData json.RawMessage
	err := m.DB.Get(&resultData, `
		SELECT COALESCE(json_agg(t), '[]'::json)
		FROM (
			SELECT f.id, f.rating, f.content, f.is_pinned, f.created_at,
				   json_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS "user"
			FROM feedbacks f
			JOIN "user" u ON u.id = f.user_id
			LEFT JOIN courses c ON c.id = f.course_id
			WHERE f.is_pinned = true
		) t`)
	if err != nil {
		return nil, err
	}

	var list []Feedback
	if err := json.Unmarshal(resultData, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (m *FeedbacksModule) UpdateRepository(id string, pin bool) (*Feedback, error) {
	var resultData json.RawMessage
	err := m.DB.Get(&resultData, `
		WITH updated AS (
			UPDATE feedbacks SET is_pinned = $1 WHERE id = $2 RETURNING *
		)
		SELECT row_to_json(formatted.*)
		FROM (
			SELECT u.id, u.rating, u.content, u.is_pinned, u.created_at,
				   json_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   json_build_object('id', usr.id, 'name', COALESCE(usr.name, ''), 'image', usr.image) AS "user"
			FROM updated u
			JOIN "user" usr ON usr.id = u.user_id
			LEFT JOIN courses c ON c.id = u.course_id
		) formatted`, pin, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFeedbackNotFound
		}
		return nil, err
	}

	var f Feedback
	if err := json.Unmarshal(resultData, &f); err != nil {
		return nil, err
	}
	return &f, nil
}

func (m *FeedbacksModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.Get(&deletedID, `DELETE FROM feedbacks WHERE id = $1 RETURNING id`, id)
	return deletedID, err
}

func (m *FeedbacksModule) InspectRepository(page, limit int, tutorID string) ([]Feedback, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}
	err := m.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total 
			FROM feedbacks f
			JOIN courses c ON c.id = f.course_id
			WHERE c.tutor_id = $1
		),
		data_cte AS (
			SELECT f.id, f.rating, f.content, f.is_pinned, f.created_at,
				   json_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS "user"
			FROM feedbacks f
			JOIN courses c ON c.id = f.course_id
			JOIN "user" u ON u.id = f.user_id
			WHERE c.tutor_id = $1
			ORDER BY f.created_at DESC
			LIMIT $2 OFFSET $3
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, tutorID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []Feedback
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}
