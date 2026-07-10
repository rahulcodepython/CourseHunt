package discussions

import (
	"database/sql"
)

func (m *DiscussionsModule) ListByLessonRepository(lessonID string, page, limit int) ([]DiscussionResponse, int, error) {
	offset := (page - 1) * limit
	total := 0

	// Using COUNT(*) OVER() combines the pagination fetch and total computation into 1 roundtrip
	rows, err := m.DB.Query(`
		SELECT d.id, d.content, d.depth, d.reply_count, d.created_at,
		       u.id, u.name, u.image,
		       COUNT(*) OVER() AS total_count
		FROM discussions d
		JOIN "user" u ON u.id = d.user_id
		WHERE d.lesson_id = $1 AND d.parent_id IS NULL
		ORDER BY d.created_at DESC 
		LIMIT $2 OFFSET $3`, lessonID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	// Since m.ScanDiscussions expects a standard structure stream,
	// we extract total_count manually or adjust scanning loop inside a modified scanner.
	var discussions []DiscussionResponse
	for rows.Next() {
		var d DiscussionResponse
		// Assuming your structure matches the fields: update Scan accordingly
		err := rows.Scan(
			&d.ID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt,
			&d.User.ID, &d.User.Name, &d.User.Image,
			&total,
		)
		if err != nil {
			return nil, 0, err
		}
		discussions = append(discussions, d)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	if discussions == nil {
		discussions = []DiscussionResponse{}
	}

	return discussions, total, nil
}

func (m *DiscussionsModule) ListRepliesRepository(parentID string, page, limit int) ([]DiscussionResponse, int, error) {
	offset := (page - 1) * limit
	total := 0

	rows, err := m.DB.Query(`
		SELECT d.id, d.content, d.depth, d.reply_count, d.created_at,
		       u.id, u.name, u.image,
		       COUNT(*) OVER() AS total_count
		FROM discussions d
		JOIN "user" u ON u.id = d.user_id
		WHERE d.parent_id = $1
		ORDER BY d.created_at ASC 
		LIMIT $2 OFFSET $3`, parentID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var discussions []DiscussionResponse
	for rows.Next() {
		var d DiscussionResponse
		err := rows.Scan(
			&d.ID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt,
			&d.User.ID, &d.User.Name, &d.User.Image,
			&total,
		)
		if err != nil {
			return nil, 0, err
		}
		discussions = append(discussions, d)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	if discussions == nil {
		discussions = []DiscussionResponse{}
	}

	return discussions, total, nil
}

func (m *DiscussionsModule) CreateRepository(userID, lessonID, courseID string, req CreateDiscussionRequest) (*Discussion, error) {
	var d Discussion

	// This single INSERT statement calculates the dynamic inheritance depth using an inline subquery
	query := `
		INSERT INTO discussions (lesson_id, course_id, user_id, parent_id, content, depth)
		VALUES (
			$1, $2, $3, $4, $5, 
			COALESCE((SELECT depth + 1 FROM discussions WHERE id = $4), 0)
		)
		RETURNING id, lesson_id, course_id, user_id, parent_id, content, depth, reply_count, created_at, updated_at`

	err := m.DB.QueryRow(query, lessonID, courseID, userID, req.ParentID, req.Content).Scan(
		&d.ID, &d.LessonID, &d.CourseID, &d.User.ID, &d.ParentID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (m *DiscussionsModule) UpdateRepository(id, userID string, content string) (*Discussion, error) {
	var d Discussion
	err := m.DB.QueryRow(`
		UPDATE discussions SET content = $1, updated_at = CURRENT_TIMESTAMP 
		WHERE id = $2 AND user_id = $3
		RETURNING id, lesson_id, course_id, user_id, parent_id, content, depth, reply_count, created_at, updated_at`,
		content, id, userID,
	).Scan(&d.ID, &d.LessonID, &d.CourseID, &d.User.ID, &d.ParentID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (m *DiscussionsModule) DeleteRepository(id, userID string, isAdmin bool) (string, error) {
	var deletedID string
	var err error

	if isAdmin {
		err = m.DB.QueryRow(`DELETE FROM discussions WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	} else {
		err = m.DB.QueryRow(`DELETE FROM discussions WHERE id = $1 AND user_id = $2 RETURNING id`, id, userID).Scan(&deletedID)
	}

	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil // Or return a custom permission denied / non-existent error
		}
		return "", err
	}
	return deletedID, nil
}
