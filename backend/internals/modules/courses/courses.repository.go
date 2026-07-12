package courses

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"coursehunt-backend/internals/utils"

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
	setClauses := []string{"updated_at = CURRENT_TIMESTAMP"}
	var args []interface{}
	argIdx := 1

	if req.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.ShortDescription != nil {
		setClauses = append(setClauses, fmt.Sprintf("short_description = $%d", argIdx))
		args = append(args, *req.ShortDescription)
		argIdx++
	}
	if req.LongDescription != nil {
		setClauses = append(setClauses, fmt.Sprintf("long_description = $%d", argIdx))
		args = append(args, *req.LongDescription)
		argIdx++
	}
	if req.ImageURL != nil {
		setClauses = append(setClauses, fmt.Sprintf("image_url = $%d", argIdx))
		args = append(args, *req.ImageURL)
		argIdx++
	}
	if req.PreviewVideoURL != nil {
		setClauses = append(setClauses, fmt.Sprintf("preview_video_url = $%d", argIdx))
		args = append(args, *req.PreviewVideoURL)
		argIdx++
	}
	if req.Language != nil {
		setClauses = append(setClauses, fmt.Sprintf("language = $%d", argIdx))
		args = append(args, *req.Language)
		argIdx++
	}
	if req.Level != nil {
		setClauses = append(setClauses, fmt.Sprintf("level = $%d", argIdx))
		args = append(args, *req.Level)
		argIdx++
	}
	if req.ActualPrice != nil {
		setClauses = append(setClauses, fmt.Sprintf("actual_price = $%d", argIdx))
		args = append(args, *req.ActualPrice)
		argIdx++
	}
	if req.FinalPrice != nil {
		setClauses = append(setClauses, fmt.Sprintf("final_price = $%d", argIdx))
		args = append(args, *req.FinalPrice)
		argIdx++
	}
	if req.Benefits != nil {
		setClauses = append(setClauses, fmt.Sprintf("benefits = $%d", argIdx))
		args = append(args, pq.Array(*req.Benefits))
		argIdx++
	}
	if req.Requirements != nil {
		setClauses = append(setClauses, fmt.Sprintf("requirements = $%d", argIdx))
		args = append(args, pq.Array(*req.Requirements))
		argIdx++
	}
	if req.CategoryID != nil {
		setClauses = append(setClauses, fmt.Sprintf("category_id = $%d", argIdx))
		args = append(args, *req.CategoryID)
		argIdx++
	}
	if req.SubcategoryID != nil {
		setClauses = append(setClauses, fmt.Sprintf("subcategory_id = $%d", argIdx))
		args = append(args, *req.SubcategoryID)
		argIdx++
	}
	if req.CouponAllowed != nil {
		setClauses = append(setClauses, fmt.Sprintf("coupon_allowed = $%d", argIdx))
		args = append(args, *req.CouponAllowed)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}

	tutorArgIdx := argIdx
	idArgIdx := argIdx + 1
	args = append(args, tutorID, id)

	query := fmt.Sprintf(`
		WITH target_course AS (
			SELECT tutor_id FROM courses WHERE id = $%d
		),
		updated AS (
			UPDATE courses SET %s WHERE id = $%d AND tutor_id = $%d
			RETURNING *
		)
		SELECT 
			(SELECT tutor_id FROM target_course) AS db_tutor_id,
			row_to_json(updated.*) AS updated_data
		FROM (SELECT 1) dummy
		LEFT JOIN updated ON true
	`, idArgIdx, strings.Join(setClauses, ", "), idArgIdx, tutorArgIdx)

	var result struct {
		DBTutorID   *string          `db:"db_tutor_id"`
		UpdatedData *json.RawMessage `db:"updated_data"`
	}

	err := m.DB.Get(&result, query, args...)
	if err != nil {
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

func (m *CoursesModule) StudyMetadataRepository(courseID, userID string) (*CourseStudyResponse, error) {
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
	err := m.DB.Get(&result, query, courseID, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.CourseExists:
		return nil, ErrCourseNotFound
	case !result.IsEnrolled:
		return nil, ErrNotEnrolled
	case result.StudyData == nil:
		return nil, errors.New("failed to fetch study data")
	}

	var resp CourseStudyResponse
	if err := json.Unmarshal(*result.StudyData, &resp); err != nil {
		return nil, err
	}

	return &resp, nil
}

func (m *CoursesModule) PublicSingleRepository(slug, userID string) (*CourseLandingResponse, error) {
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
			'is_enrolled', EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = $2 AND e.course_id = c.id AND e.revoked = false),
			'category', CASE 
				WHEN cat.id IS NOT NULL THEN json_build_object('id', cat.id, 'name', cat.name)
				ELSE NULL
			END,
			'subcategory', CASE 
				WHEN subcat.id IS NOT NULL THEN json_build_object('id', subcat.id, 'name', subcat.name)
				ELSE NULL
			END,
			'instructor', json_build_object(
				'id', u.id,
				'name', COALESCE(u.name, ''),
				'image', u.image,
				'headline', tp.headline
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
		LEFT JOIN categories subcat ON c.subcategory_id = subcat.id
		LEFT JOIN "user" u ON c.tutor_id = u.id
		LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
		WHERE c.slug = $1 AND c.status = 'published'
	`
	err := m.DB.Get(&resultData, query, slug, userID)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrCourseNotFound
		default:
			return nil, err
		}
	}

	var resp CourseLandingResponse
	if err := json.Unmarshal(resultData, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (m *CoursesModule) PublicListRepository(page, limit int, categoryID, subcategoryID, level, search string) ([]CoursePublicResponse, int, error) {
	offset := (page - 1) * limit
	where := []string{"c.status = 'published'"}
	args := []interface{}{}
	idx := 1

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
			SELECT c.id, c.slug, c.title, c.short_description, c.image_url,
			       c.actual_price, c.final_price, COALESCE(c.benefits, '{}') AS benefits,
			       c.level, c.rating_avg, c.feedback_count,
			       CASE WHEN cat.id IS NOT NULL THEN json_build_object('id', cat.id, 'name', cat.name) ELSE NULL END AS category,
			       CASE WHEN subcat.id IS NOT NULL THEN json_build_object('id', subcat.id, 'name', subcat.name) ELSE NULL END AS subcategory,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS instructor
			FROM courses c
			LEFT JOIN categories cat ON c.category_id = cat.id
			LEFT JOIN categories subcat ON c.subcategory_id = subcat.id
			LEFT JOIN "user" u ON u.id = c.tutor_id
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

	var cards []CoursePublicResponse
	if err := json.Unmarshal(result.Data, &cards); err != nil {
		return nil, 0, err
	}
	return cards, result.Total, nil
}

func (m *CoursesModule) TutorListRepository(page, limit int, tutorID, categoryID, subcategoryID, level, search, status string) ([]CourseInspectResponse, int, error) {
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
			SELECT c.id, c.slug, c.title, c.short_description, c.long_description, c.image_url, c.preview_video_url,
			       c.language, c.level, c.actual_price, c.final_price, COALESCE(c.benefits, '{}') AS benefits, COALESCE(c.requirements, '{}') AS requirements,
			       c.coupon_allowed, c.status, c.total_lectures, c.total_duration_seconds, c.rating_avg, c.feedback_count,
			       c.created_at, c.updated_at,
			       CASE WHEN cat.id IS NOT NULL THEN json_build_object('id', cat.id, 'name', cat.name) ELSE NULL END AS category,
			       CASE WHEN subcat.id IS NOT NULL THEN json_build_object('id', subcat.id, 'name', subcat.name) ELSE NULL END AS subcategory,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS instructor,
			       (
			       		SELECT COALESCE(json_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::json)
			       		FROM (
			       			SELECT 
			       				ch.id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds,
			       				(
			       					SELECT COALESCE(json_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::json)
			       					FROM (
			       						SELECT l.id, l.lesson_no, l.title, l.lesson_type, l.short_description, l.preview_video_url, l.duration_seconds
			       						FROM lessons l
			       						WHERE l.chapter_id = ch.id
			       					) lessons_tree
			       				) AS lessons
			       			FROM chapters ch
			       			WHERE ch.course_id = c.id
			       		) chapters_tree
			       ) AS chapters
			FROM courses c
			LEFT JOIN categories cat ON c.category_id = cat.id
			LEFT JOIN categories subcat ON c.subcategory_id = subcat.id
			LEFT JOIN "user" u ON u.id = c.tutor_id
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

	var list []CourseInspectResponse
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}

func (m *CoursesModule) InspectRepository(page, limit int, categoryID, subcategoryID, level, search, tutorID, status string) ([]CourseInspectResponse, int, error) {
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
			SELECT c.id, c.slug, c.title, c.short_description, c.long_description, c.image_url, c.preview_video_url,
			       c.language, c.level, c.actual_price, c.final_price, COALESCE(c.benefits, '{}') AS benefits, COALESCE(c.requirements, '{}') AS requirements,
			       c.coupon_allowed, c.status, c.total_lectures, c.total_duration_seconds, c.rating_avg, c.feedback_count,
			       c.created_at, c.updated_at,
			       CASE WHEN cat.id IS NOT NULL THEN json_build_object('id', cat.id, 'name', cat.name) ELSE NULL END AS category,
			       CASE WHEN subcat.id IS NOT NULL THEN json_build_object('id', subcat.id, 'name', subcat.name) ELSE NULL END AS subcategory,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS instructor,
			       (
			       		SELECT COALESCE(json_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::json)
			       		FROM (
			       			SELECT 
			       				ch.id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds,
			       				(
			       					SELECT COALESCE(json_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::json)
			       					FROM (
			       						SELECT l.id, l.lesson_no, l.title, l.lesson_type, l.short_description, l.preview_video_url, l.duration_seconds
			       						FROM lessons l
			       						WHERE l.chapter_id = ch.id
			       					) lessons_tree
			       				) AS lessons
			       			FROM chapters ch
			       			WHERE ch.course_id = c.id
			       		) chapters_tree
			       ) AS chapters
			FROM courses c
			LEFT JOIN categories cat ON c.category_id = cat.id
			LEFT JOIN categories subcat ON c.subcategory_id = subcat.id
			LEFT JOIN "user" u ON u.id = c.tutor_id
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

	var list []CourseInspectResponse
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}

func (m *CoursesModule) EnrolledCoursesRepository(userID string) ([]EnrolledCourseResponse, error) {
	var data []byte
	err := m.DB.Get(&data, `
		SELECT COALESCE(json_agg(t), '[]'::json)
		FROM (
			SELECT c.id, c.slug, c.title, c.image_url, e.completion_percent, e.last_accessed_lesson_id
			FROM enrollments e
			JOIN courses c ON c.id = e.course_id
			WHERE e.user_id = $1 AND e.revoked = false
			ORDER BY e.enrolled_at DESC
		) t`, userID)
	if err != nil {
		return nil, err
	}
	var list []EnrolledCourseResponse
	err = json.Unmarshal(data, &list)
	return list, err
}
