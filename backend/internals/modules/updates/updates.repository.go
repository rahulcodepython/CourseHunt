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
	// OPTIMIZATION 1: Use a writable CTE to fetch unseen rows AND mark them as seen
	// simultaneously in a single query packet over the network.
	unseenRows, err := m.DB.Query(`
		WITH target_unseen AS (
			SELECT cu.id
			FROM course_updates cu
			LEFT JOIN update_seen us ON us.update_id = cu.id AND us.user_id = $1
			WHERE us.id IS NULL
			  AND (cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
		),
		mark_as_seen AS (
			INSERT INTO update_seen (user_id, update_id)
			SELECT $1, id FROM target_unseen
			ON CONFLICT DO NOTHING
		)
		SELECT cu.id, cu.message, cu.course_id, c.title, cu.created_at
		FROM course_updates cu
		LEFT JOIN courses c ON c.id = cu.course_id
		WHERE cu.id IN (SELECT id FROM target_unseen)
		ORDER BY cu.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer unseenRows.Close()

	var unseen []UpdateFeedItem
	for unseenRows.Next() {
		var item UpdateFeedItem
		var cid, ctitle *string
		if err := unseenRows.Scan(&item.ID, &item.Message, &cid, &ctitle, &item.CreatedAt); err != nil {
			return nil, err
		}
		if cid != nil {
			item.Course.ID = *cid
		}
		if ctitle != nil {
			item.Course.Title = *ctitle
		}
		unseen = append(unseen, item)
	}
	if err := unseenRows.Err(); err != nil {
		return nil, err
	}
	if unseen == nil {
		unseen = []UpdateFeedItem{}
	}

	// OPTIMIZATION 2: Leverage COUNT(*) OVER() windowing to pull older feeds
	// and their total matching counts in 1 network call instead of 2.
	offset := (page - 1) * limit
	total := 0

	olderRows, err := m.DB.Query(`
		SELECT cu.id, cu.message, cu.course_id, c.title, cu.created_at,
		       COUNT(*) OVER() AS total_count
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
		var cid, ctitle *string
		if err := olderRows.Scan(&item.ID, &item.Message, &cid, &ctitle, &item.CreatedAt, &total); err != nil {
			return nil, err
		}
		if cid != nil {
			item.Course.ID = *cid
		}
		if ctitle != nil {
			item.Course.Title = *ctitle
		}
		older = append(older, item)
	}
	if err := olderRows.Err(); err != nil {
		return nil, err
	}
	if older == nil {
		older = []UpdateFeedItem{}
	}

	return &UpdateFeedResponse{
		Unseen: unseen,
		Older: models.PaginatedResponse[[]UpdateFeedItem]{
			Data:  older,
			Total: total,
			Page:  page,
			Limit: limit,
		},
	}, nil
}

func (m *UpdatesModule) ListRepository(page, limit int) ([]CourseUpdate, int, error) {
	offset := (page - 1) * limit
	total := 0

	// OPTIMIZATION 3: Combined sequential count + list into 1 round-trip.
	rows, err := m.DB.Query(`
		SELECT cu.id, cu.course_id, c.title, c.thumbnail, cu.created_by, cu.message, cu.created_at,
		       COUNT(*) OVER() AS total_count
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
		if err := rows.Scan(&u.ID, &dbCourseID, &cTitle, &cThumb, &u.CreatedBy, &u.Message, &u.CreatedAt, &total); err != nil {
			return nil, 0, err
		}
		if dbCourseID != nil {
			u.Course.ID = *dbCourseID
			if cTitle != nil {
				u.Course.Title = *cTitle
			}
			u.Course.Thumbnail = cThumb
		}
		list = append(list, u)
	}
	if list == nil {
		list = []CourseUpdate{}
	}
	return list, total, rows.Err()
}
