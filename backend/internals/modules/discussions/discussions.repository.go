package discussions

import "database/sql"

func (m *DiscussionsModule) ListByLessonRepository(lessonID string, page, limit int) ([]DiscussionResponse, int, error) {
	var total int
	m.DB.QueryRow(`SELECT COUNT(*) FROM discussions WHERE lesson_id = $1 AND parent_id IS NULL`, lessonID).Scan(&total)

	offset := (page - 1) * limit
	rows, err := m.DB.Query(`
		SELECT d.id, d.content, d.depth, d.reply_count, d.created_at,
		       u.id, u.name, u.image
		FROM discussions d
		JOIN "user" u ON u.id = d.user_id
		WHERE d.lesson_id = $1 AND d.parent_id IS NULL
		ORDER BY d.created_at DESC LIMIT $2 OFFSET $3`, lessonID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	return m.scanDiscussions(rows), total, nil
}

func (m *DiscussionsModule) ListRepliesRepository(parentID string, page, limit int) ([]DiscussionResponse, int, error) {
	var total int
	m.DB.QueryRow(`SELECT COUNT(*) FROM discussions WHERE parent_id = $1`, parentID).Scan(&total)

	offset := (page - 1) * limit
	rows, err := m.DB.Query(`
		SELECT d.id, d.content, d.depth, d.reply_count, d.created_at,
		       u.id, u.name, u.image
		FROM discussions d
		JOIN "user" u ON u.id = d.user_id
		WHERE d.parent_id = $1
		ORDER BY d.created_at ASC LIMIT $2 OFFSET $3`, parentID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	return m.scanDiscussions(rows), total, nil
}

func (m *DiscussionsModule) CreateRepository(userID, lessonID, courseID string, req CreateDiscussionRequest) (*Discussion, error) {
	depth := 0
	if req.ParentID != nil {
		m.DB.QueryRow(`SELECT depth FROM discussions WHERE id = $1`, *req.ParentID).Scan(&depth)
		depth++
	}
	var d Discussion
	err := m.DB.QueryRow(`
		INSERT INTO discussions (lesson_id, course_id, user_id, parent_id, content, depth)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, lesson_id, course_id, user_id, parent_id, content, depth, reply_count, created_at, updated_at`,
		lessonID, courseID, userID, req.ParentID, req.Content, depth,
	).Scan(&d.ID, &d.LessonID, &d.CourseID, &d.UserID, &d.ParentID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt, &d.UpdatedAt)
	return &d, err
}

func (m *DiscussionsModule) DeleteRepository(id, userID string, isAdmin bool) error {
	if isAdmin {
		_, err := m.DB.Exec(`DELETE FROM discussions WHERE id = $1`, id)
		return err
	}
	_, err := m.DB.Exec(`DELETE FROM discussions WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

func (m *DiscussionsModule) scanDiscussions(rows *sql.Rows) []DiscussionResponse {
	var list []DiscussionResponse
	for rows.Next() {
		var d DiscussionResponse
		rows.Scan(&d.ID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt,
			&d.User.ID, &d.User.Name, &d.User.Image)
		list = append(list, d)
	}
	if list == nil {
		list = []DiscussionResponse{}
	}
	return list
}
