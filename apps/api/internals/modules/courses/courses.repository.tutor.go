package courses

import (
	"encoding/json"
	"fmt"
	"strings"
)

func (m *CoursesModule) TutorListRepository(page, limit int, tutorID, categoryID, subcategoryID, level, search, status string) ([]Course, int, error) {
	offset := (page - 1) * limit
	where := []string{"c.tutor_id = $1"}
	args := []interface{}{tutorID}
	idx := 2

	if status != "" {
		where = append(where, fmt.Sprintf("c.status = $%d", idx))
		args = append(args, status)
		idx++
	}
	if categoryID != "" {
		where = append(where, fmt.Sprintf("c.category_id = $%d", idx))
		args = append(args, categoryID)
		idx++
	}
	if subcategoryID != "" {
		where = append(where, fmt.Sprintf("c.subcategory_id = $%d", idx))
		args = append(args, subcategoryID)
		idx++
	}
	if level != "" {
		where = append(where, fmt.Sprintf("c.level = $%d", idx))
		args = append(args, level)
		idx++
	}
	if search != "" {
		where = append(where, fmt.Sprintf("(c.title ILIKE $%d OR c.short_description ILIKE $%d)", idx, idx))
		args = append(args, "%"+search+"%")
		idx++
	}

	whereStr := strings.Join(where, " AND ")
	args = append(args, limit, offset)

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}

	err := m.DB.Get(&result, fmt.Sprintf(`
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM courses c WHERE %s
		),
		data_cte AS (
			SELECT c.id, c.tutor_id, c.slug, c.title, c.short_description, c.long_description, c.image_url, c.preview_video_url,
			       c.language, c.level, c.actual_price, c.final_price, COALESCE(c.benefits, '{}') AS benefits, COALESCE(c.requirements, '{}') AS requirements,
			       c.category_id, c.subcategory_id, c.coupon_allowed, c.status, c.total_lectures, c.total_duration_seconds, c.rating_avg, c.feedback_count,
			       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.revoked = false) AS student_count,
			       c.created_at, c.updated_at
			FROM courses c
			WHERE %s
			ORDER BY c.created_at DESC
			LIMIT $%d OFFSET $%d
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, whereStr, whereStr, idx, idx+1), args...)

	if err != nil {
		return nil, 0, err
	}

	var list []Course
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}

func (m *CoursesModule) InspectRepository(page, limit int, categoryID, subcategoryID, level, search, tutorID, status string) ([]Course, int, error) {
	offset := (page - 1) * limit
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1

	if status != "" {
		where = append(where, fmt.Sprintf("c.status = $%d", idx))
		args = append(args, status)
		idx++
	}
	if categoryID != "" {
		where = append(where, fmt.Sprintf("c.category_id = $%d", idx))
		args = append(args, categoryID)
		idx++
	}
	if subcategoryID != "" {
		where = append(where, fmt.Sprintf("c.subcategory_id = $%d", idx))
		args = append(args, subcategoryID)
		idx++
	}
	if level != "" {
		where = append(where, fmt.Sprintf("c.level = $%d", idx))
		args = append(args, level)
		idx++
	}
	if search != "" {
		where = append(where, fmt.Sprintf("(c.title ILIKE $%d OR c.short_description ILIKE $%d)", idx, idx))
		args = append(args, "%"+search+"%")
		idx++
	}
	if tutorID != "" {
		where = append(where, fmt.Sprintf("c.tutor_id = $%d", idx))
		args = append(args, tutorID)
		idx++
	}

	whereStr := strings.Join(where, " AND ")
	args = append(args, limit, offset)

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}

	err := m.DB.Get(&result, fmt.Sprintf(`
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM courses c WHERE %s
		),
		data_cte AS (
			SELECT c.id, c.tutor_id, c.slug, c.title, c.short_description, c.long_description, c.image_url, c.preview_video_url,
			       c.language, c.level, c.actual_price, c.final_price, COALESCE(c.benefits, '{}') AS benefits, COALESCE(c.requirements, '{}') AS requirements,
			       c.category_id, c.subcategory_id, c.coupon_allowed, c.status, c.total_lectures, c.total_duration_seconds, c.rating_avg, c.feedback_count,
			       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.revoked = false) AS student_count,
			       c.created_at, c.updated_at
			FROM courses c
			WHERE %s
			ORDER BY c.created_at DESC
			LIMIT $%d OFFSET $%d
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, whereStr, whereStr, idx, idx+1), args...)

	if err != nil {
		return nil, 0, err
	}

	var list []Course
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}
