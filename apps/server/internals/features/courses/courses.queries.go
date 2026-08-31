package courses

import "fmt"

const (
	CreateCourse = `
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
		SELECT row_to_json(inserted)::jsonb || jsonb_build_object('student_count', 0) FROM inserted;
	`

	UpdateCourse = `
		WITH target_course AS (
			SELECT tutor_id, image_url AS old_image_url, preview_video_url AS old_preview_video_url
			FROM courses WHERE id = $1
		),
		updated AS (
			UPDATE courses SET
				title = COALESCE($3, title),
				short_description = COALESCE($4, short_description),
				long_description = COALESCE($5, long_description),
				image_url = CASE WHEN $6::text IS NULL THEN image_url WHEN $6::text = '' THEN NULL ELSE $6::text END,
				preview_video_url = CASE WHEN $7::text IS NULL THEN preview_video_url WHEN $7::text = '' THEN NULL ELSE $7::text END,
				language = COALESCE($8, language),
				level = COALESCE($9, level),
				actual_price = COALESCE($10, actual_price),
				final_price = COALESCE($11, final_price),
				benefits = COALESCE($12, benefits),
				requirements = COALESCE($13, requirements),
				category_id = COALESCE($14, category_id),
				coupon_allowed = COALESCE($15, coupon_allowed),
				is_free = COALESCE($16, is_free),
				status = COALESCE($17, status),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $1 AND tutor_id = $2
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
		LEFT JOIN updated ON true;
	`

	DeleteCourse = `
		WITH target_course AS (
			SELECT tutor_id FROM courses WHERE id = $1
		),
		deleted AS (
			DELETE FROM courses WHERE id = $1 AND tutor_id = $2
			RETURNING id
		)
		SELECT
			(SELECT tutor_id FROM target_course) AS db_tutor_id,
			(SELECT id FROM deleted) AS deleted_id;
	`

	StudyMetadata = `
		WITH target_course AS (
			SELECT id FROM courses WHERE id = NULLIF($1, '')::uuid
		),
		enrollment_info AS (
			SELECT id FROM enrollments WHERE course_id = NULLIF($1, '')::uuid AND user_id = NULLIF($2, '')::uuid AND revoked = false
		)
		SELECT
			EXISTS(SELECT 1 FROM target_course) AS course_exists,
			EXISTS(SELECT 1 FROM enrollment_info) AS is_enrolled,
			CASE
				WHEN EXISTS(SELECT 1 FROM enrollment_info) THEN (
					SELECT jsonb_build_object(
						'course', jsonb_build_object(
							'id', c.id,
							'title', c.title,
							'thumbnail', c.image_url
						),
						'completion_percent', COALESCE(e.completion_percent, 0),
						'completed', COALESCE(e.completed, false),
						'chapters', (
							SELECT COALESCE(jsonb_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::jsonb)
							FROM (
								SELECT
									ch.id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds,
									jsonb_build_object(
										'lessons_completed', COALESCE(cp.lessons_completed, 0),
										'completed', COALESCE(cp.completed, false)
									) AS progress,
									(
										SELECT COALESCE(jsonb_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::jsonb)
										FROM (
											SELECT
												l.id, l.lesson_no, l.title, l.lesson_type, l.duration_seconds,
												COALESCE(lp.completed, false) AS completed
											FROM lessons l
											LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = NULLIF($2, '')::uuid
											WHERE l.chapter_id = ch.id
										) lessons_tree
									) AS lessons
								FROM chapters ch
								LEFT JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = NULLIF($2, '')::uuid
								WHERE ch.course_id = c.id
							) chapters_tree
						)
					)
					FROM courses c
					LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = NULLIF($2, '')::uuid
					WHERE c.id = NULLIF($1, '')::uuid
				)
				ELSE NULL
			END AS study_data;
	`

	EnrollFree = `
		WITH target_course AS (
			SELECT id, is_free FROM courses WHERE id = $1
		),
		existing_enrollment AS (
			SELECT id FROM enrollments WHERE user_id = $2 AND course_id = $1 AND revoked = false
		),
		status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS (SELECT 1 FROM target_course) THEN 0
					WHEN NOT (SELECT is_free FROM target_course) THEN 1
					WHEN EXISTS (SELECT 1 FROM existing_enrollment) THEN 2
					ELSE 3
				END AS status_code
		),
		enrolled AS (
			INSERT INTO enrollments (user_id, course_id, revoked)
			SELECT $2, $1, false FROM status_check WHERE status_check.status_code = 3
			ON CONFLICT (user_id, course_id) DO UPDATE SET revoked = false
		),
		txn AS (
			INSERT INTO transactions (user_id, course_id, amount, currency, status, confirmed_at)
			SELECT $2, $1, 0, 'INR', 'success', CURRENT_TIMESTAMP
			FROM status_check WHERE status_check.status_code = 3
		)
		SELECT status_code FROM status_check;
	`

	PublicSingle = `
		SELECT jsonb_build_object(
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
			'is_free', c.is_free,
			'benefits', COALESCE(c.benefits, '{}'),
			'requirements', COALESCE(c.requirements, '{}'),
			'total_lectures', c.total_lectures,
			'total_duration_seconds', c.total_duration_seconds,
			'rating_avg', c.rating_avg,
			'feedback_count', c.feedback_count,
			'is_enrolled', EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = NULLIF($2, '')::uuid AND e.course_id = c.id AND e.revoked = false),
			'category', CASE
				WHEN cat.id IS NOT NULL THEN jsonb_build_object('id', cat.id, 'name', cat.name)
				ELSE NULL
			END,
			'instructor', jsonb_build_object(
				'id', u.id,
				'name', COALESCE(u.name, ''),
				'image', u.image
			),
			'chapters', (
				SELECT COALESCE(jsonb_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::jsonb)
				FROM (
					SELECT
						ch.id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds,
						(
							SELECT COALESCE(jsonb_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::jsonb)
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
		WHERE c.slug = $1 AND c.status = 'published';
	`

	GetByID = `
		WITH enrollment_counts AS (
			SELECT e.course_id, COUNT(*) AS student_count
			FROM enrollments e
			WHERE e.revoked = false
			GROUP BY e.course_id
		)
		SELECT row_to_json(data) AS data
		FROM (
			SELECT c.id, c.tutor_id, c.slug, c.title, c.short_description, c.long_description, c.image_url, c.preview_video_url,
			       c.language, c.level, c.actual_price, c.final_price, COALESCE(c.benefits, '{}') AS benefits, COALESCE(c.requirements, '{}') AS requirements,
			       c.category_id, c.coupon_allowed, c.is_free, c.status, c.total_lectures, c.total_duration_seconds, c.rating_avg, c.feedback_count,
			       COALESCE(ec.student_count, 0) AS student_count,
			       CASE
			       		WHEN t.id IS NOT NULL THEN jsonb_build_object(
			       			'id', t.id,
			       			'name', COALESCE(t.name, ''),
			       			'image', t.image
			       		)
			       		ELSE NULL
			       END AS tutor,
			       c.created_at, c.updated_at
			FROM courses c
			LEFT JOIN enrollment_counts ec ON ec.course_id = c.id
			LEFT JOIN "users" t ON c.tutor_id = t.id
			WHERE c.id = $1
				AND (NULLIF($2, '') IS NULL OR c.tutor_id = NULLIF($2, '')::uuid)
		) data;
	`

	EnrolledCoursesJSON = `
		SELECT jsonb_build_object(
			'total', COALESCE((
				SELECT COUNT(*) FROM enrollments e
				WHERE e.user_id = NULLIF($1, '')::uuid AND e.revoked = false
			), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', c.id,
						'slug', c.slug,
						'title', c.title,
						'image_url', c.image_url,
						'completion_percent', e.completion_percent,
						'last_accessed_lesson_id', e.last_accessed_lesson_id
					) ORDER BY e.enrolled_at DESC
				)
				FROM (
					SELECT e.course_id, e.completion_percent, e.last_accessed_lesson_id, e.enrolled_at
					FROM enrollments e
					WHERE e.user_id = NULLIF($1, '')::uuid AND e.revoked = false
					ORDER BY e.enrolled_at DESC
					LIMIT $2 OFFSET $3
				) e
				JOIN courses c ON c.id = e.course_id
			), '[]'::jsonb)
		);
	`
)

func BuildPublicListQuery(whereStr string, idx int) string {
	return fmt.Sprintf(`
		SELECT jsonb_build_object(
			'total', COALESCE((SELECT COUNT(*) FROM courses c WHERE %s), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', c.id,
						'slug', c.slug,
						'title', c.title,
						'short_description', c.short_description,
						'image_url', c.image_url,
						'actual_price', c.actual_price,
						'final_price', c.final_price,
						'is_free', c.is_free,
						'benefits', COALESCE(c.benefits, '{}'),
						'level', c.level,
						'rating_avg', c.rating_avg,
						'feedback_count', c.feedback_count,
						'category', CASE WHEN cat.id IS NOT NULL THEN jsonb_build_object('id', cat.id, 'name', cat.name) ELSE NULL END,
						'instructor', jsonb_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image)
					) ORDER BY c.created_at DESC
				)
				FROM (
					SELECT * FROM courses c
					WHERE %s
					ORDER BY c.created_at DESC
					LIMIT $%d OFFSET $%d
				) c
				LEFT JOIN categories cat ON c.category_id = cat.id
				LEFT JOIN "users" u ON c.tutor_id = u.id
			), '[]'::jsonb)
		);
	`, whereStr, whereStr, idx, idx+1)
}

func BuildTutorListQuery(whereStr string, idx int) string {
	return fmt.Sprintf(`
		WITH enrollment_counts AS (
			SELECT e.course_id, COUNT(*) AS student_count
			FROM enrollments e
			WHERE e.revoked = false
			GROUP BY e.course_id
		)
		SELECT jsonb_build_object(
			'total', COALESCE((SELECT COUNT(*) FROM courses c WHERE %s), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', c.id,
						'tutor_id', c.tutor_id,
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
						'category_id', c.category_id,
						'coupon_allowed', c.coupon_allowed,
						'is_free', c.is_free,
						'status', c.status,
						'total_lectures', c.total_lectures,
						'total_duration_seconds', c.total_duration_seconds,
						'rating_avg', c.rating_avg,
						'feedback_count', c.feedback_count,
						'student_count', COALESCE(ec.student_count, 0),
						'tutor', CASE
							WHEN t.id IS NOT NULL THEN jsonb_build_object(
								'id', t.id,
								'name', COALESCE(t.name, ''),
								'image', t.image
							)
							ELSE NULL
						END,
						'created_at', c.created_at,
						'updated_at', c.updated_at
					) ORDER BY c.created_at DESC
				)
				FROM (
					SELECT * FROM courses c
					WHERE %s
					ORDER BY c.created_at DESC
					LIMIT $%d OFFSET $%d
				) c
				LEFT JOIN enrollment_counts ec ON ec.course_id = c.id
				LEFT JOIN "users" t ON c.tutor_id = t.id
			), '[]'::jsonb)
		);
	`, whereStr, whereStr, idx, idx+1)
}
