package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type UpdateRepository struct{ DB *sql.DB }

func NewUpdateRepository() *UpdateRepository { return &UpdateRepository{DB: database.DB} }

func (r *UpdateRepository) Create(createdBy string, req models.CreateUpdateRequest) (*models.CourseUpdate, error) {
	var u models.CourseUpdate
	err := r.DB.QueryRow(`
		INSERT INTO course_updates (course_id, created_by, message)
		VALUES ($1, $2, $3)
		RETURNING id, course_id, created_by, message, created_at`,
		req.CourseID, createdBy, req.Message,
	).Scan(&u.ID, &u.CourseID, &u.CreatedBy, &u.Message, &u.CreatedAt)
	return &u, err
}

func (r *UpdateRepository) Update(id string, message string) (*models.CourseUpdate, error) {
	var u models.CourseUpdate
	err := r.DB.QueryRow(`
		UPDATE course_updates SET message = $1 WHERE id = $2
		RETURNING id, course_id, created_by, message, created_at`, message, id).
		Scan(&u.ID, &u.CourseID, &u.CreatedBy, &u.Message, &u.CreatedAt)
	return &u, err
}

func (r *UpdateRepository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM course_updates WHERE id = $1`, id)
	return err
}

func (r *UpdateRepository) GetFeed(userID string, page, limit int) (*models.UpdateFeedResponse, error) {
	// Unseen: updates after user's last seen OR all updates for that course they're enrolled in, not yet seen
	unseenRows, err := r.DB.Query(`
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

	var unseen []models.UpdateFeedItem
	var unseenIDs []string
	for unseenRows.Next() {
		var item models.UpdateFeedItem
		unseenRows.Scan(&item.ID, &item.Message, &item.CourseID, &item.CourseTitle, &item.CreatedAt)
		unseen = append(unseen, item)
		unseenIDs = append(unseenIDs, item.ID)
	}
	if unseen == nil {
		unseen = []models.UpdateFeedItem{}
	}

	// Mark unseen as seen
	for _, uid := range unseenIDs {
		r.DB.Exec(`INSERT INTO update_seen (user_id, update_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, uid)
	}

	// Older (seen / paginated)
	var total int
	r.DB.QueryRow(`SELECT COUNT(*) FROM course_updates cu WHERE cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false)`, userID).Scan(&total)

	offset := (page - 1) * limit
	olderRows, err := r.DB.Query(`
		SELECT cu.id, cu.message, cu.course_id, c.title, cu.created_at
		FROM course_updates cu
		LEFT JOIN courses c ON c.id = cu.course_id
		WHERE (cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
		ORDER BY cu.created_at DESC LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer olderRows.Close()

	var older []models.UpdateFeedItem
	for olderRows.Next() {
		var item models.UpdateFeedItem
		olderRows.Scan(&item.ID, &item.Message, &item.CourseID, &item.CourseTitle, &item.CreatedAt)
		older = append(older, item)
	}
	if older == nil {
		older = []models.UpdateFeedItem{}
	}

	return &models.UpdateFeedResponse{
		Unseen: unseen,
		Older: models.PaginatedResponse{
			Data:  older,
			Total: total,
			Page:  page,
			Limit: limit,
		},
	}, nil
}

func (r *UpdateRepository) List(page, limit int) ([]models.CourseUpdate, int, error) {
	var total int
	r.DB.QueryRow(`SELECT COUNT(*) FROM course_updates`).Scan(&total)
	offset := (page - 1) * limit
	rows, err := r.DB.Query(`SELECT id, course_id, created_by, message, created_at FROM course_updates ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []models.CourseUpdate
	for rows.Next() {
		var u models.CourseUpdate
		rows.Scan(&u.ID, &u.CourseID, &u.CreatedBy, &u.Message, &u.CreatedAt)
		list = append(list, u)
	}
	if list == nil {
		list = []models.CourseUpdate{}
	}
	return list, total, rows.Err()
}
