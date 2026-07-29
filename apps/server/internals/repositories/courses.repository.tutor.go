package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"
	"fmt"
	"strings"
)

func (r *CoursesRepository) ListRepository(page, limit int, userID string, scope generic.AuthScope, categoryID, subcategoryID, level, search, status, filterTutorID string) ([]entities.Course, int, error) {
	offset := (page - 1) * limit
	where := []string{}
	args := []interface{}{}
	idx := 1

	if scope == generic.ScopeTutor {
		where = append(where, fmt.Sprintf("c.tutor_id = $%d", idx))
		args = append(args, userID)
		idx++
	}

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
	if scope != generic.ScopeTutor && filterTutorID != "" {
		where = append(where, fmt.Sprintf("c.tutor_id = $%d", idx))
		args = append(args, filterTutorID)
		idx++
	}

	whereStr := strings.Join(where, " AND ")
	if whereStr == "" {
		whereStr = "1=1"
	}
	args = append(args, limit, offset)

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}

	err := r.DB.Get(&result, fmt.Sprintf(`
		WITH enrollment_counts AS (
			SELECT e.course_id, COUNT(*) AS student_count
			FROM enrollments e
			WHERE e.revoked = false
			GROUP BY e.course_id
		),
		count_cte AS (
			SELECT COUNT(*) AS total FROM courses c WHERE %s
		),
		data_cte AS (
			SELECT c.id, c.tutor_id, c.slug, c.title, c.short_description, c.long_description, c.image_url, c.preview_video_url,
			       c.language, c.level, c.actual_price, c.final_price, COALESCE(c.benefits, '{}') AS benefits, COALESCE(c.requirements, '{}') AS requirements,
			       c.category_id, c.subcategory_id, c.coupon_allowed, c.status, c.total_lectures, c.total_duration_seconds, c.rating_avg, c.feedback_count,
			       COALESCE(ec.student_count, 0) AS student_count,
			       c.created_at, c.updated_at
			FROM courses c
			LEFT JOIN enrollment_counts ec ON ec.course_id = c.id
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

	var list []entities.Course
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}
