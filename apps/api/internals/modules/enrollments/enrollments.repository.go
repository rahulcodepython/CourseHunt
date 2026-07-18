package enrollments

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

var (
	ErrAccessDenied = errors.New("access denied")
)

func (m *EnrollmentsModule) RevokeRepository(userID, courseID string) error {
	_, err := m.DB.Exec(`UPDATE enrollments SET revoked = true WHERE user_id = $1 AND course_id = $2`, userID, courseID)
	return err
}

func (m *EnrollmentsModule) ListRepository(page, limit int, courseID, userID, userName, userEmail, revoked string) ([]ListEnrollmentResponse, int, error) {
	offset := (page - 1) * limit

	var where []string
	args := []any{limit, offset}
	idx := 3

	if courseID != "" {
		where = append(where, fmt.Sprintf("e.course_id = $%d", idx))
		args = append(args, courseID)
		idx++
	} else {
		where = append(where, fmt.Sprintf("c.tutor_id = $%d", idx))
		args = append(args, userID)
		idx++
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
	if revoked == "true" {
		where = append(where, "e.revoked = true")
	} else if revoked == "false" {
		where = append(where, "e.revoked = false")
	}

	whereClause := strings.Join(where, " AND ")

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}
	err := m.DB.Get(&result, fmt.Sprintf(`
		WITH count_cte AS (
			SELECT COUNT(*) AS total
			FROM enrollments e
			JOIN courses c ON c.id = e.course_id
			LEFT JOIN "user" u ON e.user_id = u.id
			WHERE %s
		),
		data_cte AS (
			SELECT 
				e.id,
				json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS "user",
				e.completion_percent,
				e.completed,
				e.revoked,
				e.enrolled_at
			FROM enrollments e
			JOIN courses c ON c.id = e.course_id
			LEFT JOIN "user" u ON e.user_id = u.id
			WHERE %s
			ORDER BY e.enrolled_at DESC
			LIMIT $1 OFFSET $2
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, whereClause, whereClause), args...)

	if err != nil {
		return nil, 0, err
	}

	var list []ListEnrollmentResponse
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}

func (m *EnrollmentsModule) InspectRepository(page, limit int, courseID, tutorID, userName, userEmail, revoked string) ([]ListEnrollmentResponse, int, error) {
	offset := (page - 1) * limit

	var where []string
	args := []any{courseID, tutorID}
	idx := 3

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
	if revoked == "true" {
		where = append(where, "e.revoked = true")
	} else if revoked == "false" {
		where = append(where, "e.revoked = false")
	}

	whereClause := strings.Join(where, " AND ")
	if whereClause != "" {
		whereClause = " AND " + whereClause
	}

	args = append(args, limit, offset)

	var result struct {
		IsOwner bool            `db:"is_owner"`
		Total   int             `db:"total"`
		Data    json.RawMessage `db:"data"`
	}

	err := m.DB.Get(&result, fmt.Sprintf(`
		WITH auth AS (
			SELECT EXISTS(SELECT 1 FROM courses WHERE id = $1 AND tutor_id = $2) AS is_owner
		),
		count_cte AS (
			SELECT COUNT(*) AS total FROM enrollments e
			LEFT JOIN "user" u ON e.user_id = u.id
			CROSS JOIN auth a
			WHERE e.course_id = $1 AND a.is_owner = true%s
		),
		data_cte AS (
			SELECT 
				e.id,
				json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS "user",
				e.completion_percent,
				e.completed,
				e.revoked,
				e.enrolled_at
			FROM enrollments e
			LEFT JOIN "user" u ON e.user_id = u.id
			CROSS JOIN auth a
			WHERE e.course_id = $1 AND a.is_owner = true%s
			ORDER BY e.enrolled_at DESC
			LIMIT $%d OFFSET $%d
		)
		SELECT 
			COALESCE((SELECT is_owner FROM auth), false) AS is_owner,
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, whereClause, whereClause, idx, idx+1), args...)

	if err != nil {
		return nil, 0, err
	}

	if !result.IsOwner {
		return nil, 0, ErrAccessDenied
	}

	var list []ListEnrollmentResponse
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}

func (m *EnrollmentsModule) EnrollRepository(userID, courseID string) error {
	_, err := m.DB.Exec(`
		INSERT INTO enrollments (user_id, course_id, revoked)
		VALUES ($1, $2, false)
		ON CONFLICT (user_id, course_id) DO UPDATE SET revoked = false`,
		userID, courseID,
	)
	return err
}
