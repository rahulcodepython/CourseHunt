package assignments

const (
	CreateAssignment = `
		INSERT INTO assignments (lesson_id, title, instructions, max_score)
		VALUES ($1, $2, $3, $4)
		RETURNING id, lesson_id, title, instructions, max_score, created_at, updated_at;
	`

	GetAssignmentByLesson = `
		SELECT jsonb_build_object(
			'id', a.id,
			'lesson_id', a.lesson_id,
			'title', a.title,
			'instructions', a.instructions,
			'max_score', a.max_score,
			'created_at', a.created_at,
			'updated_at', a.updated_at
		)
		FROM assignments a
		WHERE a.lesson_id = $1;
	`

	SubmitAssignment = `
		INSERT INTO assignment_submissions (assignment_id, user_id, file_url, status)
		VALUES ($1, $2, $3, 'submitted')
		ON CONFLICT (assignment_id, user_id) DO UPDATE
		SET file_url = EXCLUDED.file_url,
		    status = 'submitted',
		    submitted_at = CURRENT_TIMESTAMP
		RETURNING id, assignment_id, user_id, file_url, score, feedback_notes, graded_by, status, submitted_at, graded_at;
	`

	GetSubmission = `
		SELECT jsonb_build_object(
			'id', s.id,
			'assignment_id', s.assignment_id,
			'user_id', s.user_id,
			'file_url', s.file_url,
			'score', s.score,
			'feedback_notes', s.feedback_notes,
			'graded_by', s.graded_by,
			'status', s.status,
			'submitted_at', s.submitted_at,
			'graded_at', s.graded_at
		)
		FROM assignment_submissions s
		WHERE s.assignment_id = $1 AND s.user_id = $2;
	`

	ListSubmissionsForAssignment = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', s.id,
					'assignment_id', s.assignment_id,
					'user_id', s.user_id,
					'user_name', u.name,
					'user_email', u.email,
					'file_url', s.file_url,
					'score', s.score,
					'feedback_notes', s.feedback_notes,
					'graded_by', s.graded_by,
					'status', s.status,
					'submitted_at', s.submitted_at,
					'graded_at', s.graded_at
				) ORDER BY s.submitted_at DESC
			), '[]'::jsonb
		)
		FROM assignment_submissions s
		JOIN "users" u ON u.id = s.user_id
		WHERE s.assignment_id = $1;
	`

	GradeSubmission = `
		UPDATE assignment_submissions
		SET score = $2, feedback_notes = $3, graded_by = $4, status = 'graded', graded_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING id, assignment_id, user_id, file_url, score, feedback_notes, graded_by, status, submitted_at, graded_at;
	`
)
