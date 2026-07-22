package lessons

func (m *LessonsModule) MarkLessonCompleteRepository(userID, lessonID string) error {
	var result struct {
		LessonExists bool `db:"lesson_exists"`
		IsEnrolled   bool `db:"is_enrolled"`
		Completed    bool `db:"completed"`
	}

	query := `
		WITH lesson_info AS (
			SELECT ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		inserted AS (
			INSERT INTO lesson_progress (user_id, lesson_id, course_id, completed, completed_at)
			SELECT $2, $1, li.course_id, true, CURRENT_TIMESTAMP
			FROM lesson_info li
			CROSS JOIN enrollment_auth ea
			WHERE ea.is_enrolled = true
			ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = CURRENT_TIMESTAMP
			RETURNING lesson_id
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			EXISTS(SELECT 1 FROM inserted) AS completed
	`
	err := m.DB.Get(&result, query, lessonID, userID)
	if err != nil {
		return err
	}

	switch {
	case !result.LessonExists:
		return ErrLessonNotFound
	case !result.IsEnrolled:
		return ErrNotEnrolled
	}

	return nil
}
