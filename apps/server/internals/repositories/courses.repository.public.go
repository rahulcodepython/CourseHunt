package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

func (r *CoursesRepository) PublicSingleRepository(slug, userID string) (*entities.CourseLandingResponse, error) {
	var resultData []byte
	query := `
		SELECT json_build_object(
			'id', c.id,
			'slug', c.slug,
			'title', c.title,
			'short_description', c.short_description,
			'long_description', c.long_description,
			'image_url', c.image_url,
			'preview_video_url', c.preview_video_url,
			'language', c.language,
			'level', c.level,
			'actual_price', c.actual_price,
			'final_price', c.final_price,
			'benefits', COALESCE(c.benefits, '{}'),
			'requirements', COALESCE(c.requirements, '{}'),
			'total_lectures', c.total_lectures,
			'total_duration_seconds', c.total_duration_seconds,
			'rating_avg', c.rating_avg,
			'feedback_count', c.feedback_count,
			'is_enrolled', EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = NULLIF($2, '')::uuid AND e.course_id = c.id AND e.revoked = false),
			'category', CASE 
				WHEN cat.id IS NOT NULL THEN json_build_object('id', cat.id, 'name', cat.name)
				ELSE NULL
			END,
			'instructor', json_build_object(
				'id', u.id,
				'name', COALESCE(u.name, ''),
				'image', u.image
			),
			'chapters', (
				SELECT COALESCE(json_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::json)
				FROM (
					SELECT
						ch.id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds,
						(
							SELECT COALESCE(json_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::json)
							FROM (
								SELECT l.id, l.lesson_no, l.title, l.lesson_type, l.duration_seconds
								FROM lessons l
								WHERE l.chapter_id = ch.id
							) lessons_tree
						) AS lessons
					FROM chapters ch
					WHERE ch.course_id = c.id
				) chapters_tree
			)
		)
		FROM courses c
		LEFT JOIN categories cat ON c.category_id = cat.id
		LEFT JOIN "users" u ON c.tutor_id = u.id
		WHERE c.slug = $1 AND c.status = 'published'
	`
	err := r.DB.Get(&resultData, query, slug, userID)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, generic.ErrCoursesCourseNotFound
		default:
			return nil, err
		}
	}

	var resp entities.CourseLandingResponse
	if err := json.Unmarshal(resultData, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (r *CoursesRepository) PublicListRepository(page, limit int, categoryID, subcategoryID, level, search string) ([]entities.CoursePublicResponse, int, error) {
	offset := (page - 1) * limit
	where := []string{"c.status = 'published'"}
	args := []interface{}{}
	idx := 1

	targetCatID := categoryID
	if targetCatID == "" && subcategoryID != "" {
		targetCatID = subcategoryID
	}

	if targetCatID != "" {
		where = append(where, fmt.Sprintf("c.category_id = NULLIF($%d, '')::uuid", idx))
		args = append(args, targetCatID)
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

	err := r.DB.Get(&result, fmt.Sprintf(`
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM courses c WHERE %s
		),
		data_cte AS (
			SELECT c.id, c.slug, c.title, c.short_description, c.image_url,
			       c.actual_price, c.final_price, COALESCE(c.benefits, '{}') AS benefits,
			       c.level, c.rating_avg, c.feedback_count,
			       CASE WHEN cat.id IS NOT NULL THEN json_build_object('id', cat.id, 'name', cat.name) ELSE NULL END AS category,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS instructor
			FROM courses c
			LEFT JOIN categories cat ON c.category_id = cat.id
			LEFT JOIN "users" u ON c.tutor_id = u.id
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

	var list []entities.CoursePublicResponse
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}
