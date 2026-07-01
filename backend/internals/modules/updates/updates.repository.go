package updates

import (
	"coursehunt-backend/internals/models"
)

func (m *UpdatesModule) CreateRepository(createdBy string, req CreateUpdateRequest) (*CourseUpdate, error) {
	var u CourseUpdate
	var dbCourseID *string
	err := m.DB.QueryRow(`
		INSERT INTO course_updates (course_id, created_by, message)
		VALUES ($1, $2, $3)
		RETURNING id, course_id, created_by, message, created_at`,
		req.CourseID, createdBy, req.Message,
	).Scan(&u.ID, &dbCourseID, &u.CreatedBy, &u.Message, &u.CreatedAt)
	if dbCourseID != nil {
		u.Course.ID = *dbCourseID
	}
	return &u, err
}

func (m *UpdatesModule) UpdateRepository(id string, message string) (*CourseUpdate, error) {
	var u CourseUpdate
	var dbCourseID *string
	err := m.DB.QueryRow(`
		UPDATE course_updates SET message = $1 WHERE id = $2
		RETURNING id, course_id, created_by, message, created_at`, message, id).
		Scan(&u.ID, &dbCourseID, &u.CreatedBy, &u.Message, &u.CreatedAt)
	if dbCourseID != nil {
		u.Course.ID = *dbCourseID
	}
	return &u, err
}

func (m *UpdatesModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM course_updates WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}

func (m *UpdatesModule) FeedRepository(userID string, page, limit int) (*UpdateFeedResponse, error) {
	// Unseen: updates after user's last seen OR all updates for that course they're enrolled in, not yet seen
	unseenRows, err := m.DB.Query(`
		SELECT cu.id, cu.message, cu.course_id, c.title, cu.created_at
		FROM course_updates cu
		LEFT JOIN courses c ON c.id = cu.course_id
		LEFT JOIN update_seen us ON us.update_id = cu.id AND us.user_id = $1
		WHERE us.id IS NULL
		  AND (cu.course_id IS NULL
		    OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
		ORDER BY cu.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer unseenRows.Close()

	var unseen []UpdateFeedItem
	var unseenIDs []string
	for unseenRows.Next() {
		var item UpdateFeedItem
		unseenRows.Scan(&item.ID, &item.Message, &item.CourseID, &item.CourseTitle, &item.CreatedAt)
		unseen = append(unseen, item)
		unseenIDs = append(unseenIDs, item.ID)
	}
	if unseen == nil {
		unseen = []UpdateFeedItem{}
	}

	// Mark unseen as seen
	for _, uid := range unseenIDs {
		m.DB.Exec(`INSERT INTO update_seen (user_id, update_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, uid)
	}

	// Older (seen / paginated)
	var total int
	m.DB.QueryRow(`SELECT COUNT(*) FROM course_updates cu WHERE cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false)`, userID).Scan(&total)

	offset := (page - 1) * limit
	olderRows, err := m.DB.Query(`
		SELECT cu.id, cu.message, cu.course_id, c.title, cu.created_at
		FROM course_updates cu
		LEFT JOIN courses c ON c.id = cu.course_id
		WHERE (cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
		ORDER BY cu.created_at DESC LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer olderRows.Close()

	var older []UpdateFeedItem
	for olderRows.Next() {
		var item UpdateFeedItem
		olderRows.Scan(&item.ID, &item.Message, &item.CourseID, &item.CourseTitle, &item.CreatedAt)
		older = append(older, item)
	}
	if older == nil {
		older = []UpdateFeedItem{}
	}

	return &UpdateFeedResponse{
		Unseen: unseen,
		Older: models.PaginatedResponse{
			Data:  older,
			Total: total,
			Page:  page,
			Limit: limit,
		},
	}, nil
}

func (m *UpdatesModule) ListRepository(page, limit int) ([]CourseUpdate, int, error) {
	var total int
	m.DB.QueryRow(`SELECT COUNT(*) FROM course_updates`).Scan(&total)
	offset := (page - 1) * limit
	rows, err := m.DB.Query(`
		SELECT cu.id, cu.course_id, c.title, c.thumbnail, cu.created_by, cu.message, cu.created_at 
		FROM course_updates cu 
		LEFT JOIN courses c ON c.id = cu.course_id 
		ORDER BY cu.created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []CourseUpdate
	for rows.Next() {
		var u CourseUpdate
		var dbCourseID, cTitle, cThumb *string
		rows.Scan(&u.ID, &dbCourseID, &cTitle, &cThumb, &u.CreatedBy, &u.Message, &u.CreatedAt)
		if dbCourseID != nil {
			u.Course.ID = *dbCourseID
			if cTitle != nil { u.Course.Title = *cTitle }
			u.Course.Thumbnail = cThumb
		}
		list = append(list, u)
	}
	if list == nil {
		list = []CourseUpdate{}
	}
	return list, total, rows.Err()
}
