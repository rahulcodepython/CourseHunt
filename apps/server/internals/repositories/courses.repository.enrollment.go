package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"
	"errors"
)

func (r *CoursesRepository) StudyMetadataRepository(courseID, userID string) (*entities.CourseStudyResponse, error) {
	var result struct {
		CourseExists bool             `db:"course_exists"`
		IsEnrolled   bool             `db:"is_enrolled"`
		StudyData    *json.RawMessage `db:"study_data"`
	}

	query := `
		WITH target_course AS (
			SELECT id FROM courses WHERE id = $1
		),
		enrollment_info AS (
			SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2 AND revoked = false
		)
		SELECT 
			EXISTS(SELECT 1 FROM target_course) AS course_exists,
			EXISTS(SELECT 1 FROM enrollment_info) AS is_enrolled,
			CASE 
				WHEN EXISTS(SELECT 1 FROM enrollment_info) THEN (
					SELECT json_build_object(
						'course', json_build_object(
							'id', c.id,
							'title', c.title,
							'thumbnail', c.image_url
						),
						'completion_percent', COALESCE(e.completion_percent, 0),
						'completed', COALESCE(e.completed, false),
						'chapters', (
							SELECT COALESCE(json_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::json)
							FROM (
								SELECT
									ch.id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds,
									json_build_object(
										'lessons_completed', COALESCE(cp.lessons_completed, 0),
										'completed', COALESCE(cp.completed, false)
									) AS progress,
									(
										SELECT COALESCE(json_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::json)
										FROM (
											SELECT
												l.id, l.lesson_no, l.title, l.lesson_type, l.duration_seconds,
												COALESCE(lp.completed, false) AS completed
											FROM lessons l
											LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
											WHERE l.chapter_id = ch.id
										) lessons_tree
									) AS lessons
								FROM chapters ch
								LEFT JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = $2
								WHERE ch.course_id = c.id
							) chapters_tree
						)
					)
					FROM courses c
					LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $2
					WHERE c.id = $1
				)
				ELSE NULL
			END AS study_data
	`
	err := r.DB.Get(&result, query, courseID, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.CourseExists:
		return nil, generic.ErrCoursesCourseNotFound
	case !result.IsEnrolled:
		return nil, generic.ErrCoursesNotEnrolled
	case result.StudyData == nil:
		return nil, errors.New("failed to fetch study data")
	}

	var resp entities.CourseStudyResponse
	if err := json.Unmarshal(*result.StudyData, &resp); err != nil {
		return nil, err
	}

	return &resp, nil
}

func (r *CoursesRepository) EnrolledCoursesRepository(userID string, page, limit int) ([]entities.EnrolledCourseResponse, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total_count"`
		Data  json.RawMessage `db:"data_json"`
	}
	err := r.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total_count
			FROM enrollments e
			WHERE e.user_id = $1 AND e.revoked = false
		),
		data_cte AS (
			SELECT c.id, c.slug, c.title, c.image_url, e.completion_percent, e.last_accessed_lesson_id
			FROM enrollments e
			JOIN courses c ON c.id = e.course_id
			WHERE e.user_id = $1 AND e.revoked = false
			ORDER BY e.enrolled_at DESC
			LIMIT $2 OFFSET $3
		)
		SELECT
			COALESCE((SELECT total_count FROM count_cte), 0) AS total_count,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data_json
	`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []entities.EnrolledCourseResponse
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}
