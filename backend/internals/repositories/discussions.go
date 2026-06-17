package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type DiscussionRepository struct{ DB *sql.DB }

func NewDiscussionRepository() *DiscussionRepository { return &DiscussionRepository{DB: database.DB} }

func (r *DiscussionRepository) ListByLesson(lessonID string, page, limit int) ([]models.DiscussionResponse, int, error) {
	var total int
	r.DB.QueryRow(`SELECT COUNT(*) FROM discussions WHERE lesson_id = $1 AND parent_id IS NULL`, lessonID).Scan(&total)

	offset := (page - 1) * limit
	rows, err := r.DB.Query(`
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
	return r.scanDiscussions(rows), total, nil
}

func (r *DiscussionRepository) ListReplies(parentID string, page, limit int) ([]models.DiscussionResponse, int, error) {
	var total int
	r.DB.QueryRow(`SELECT COUNT(*) FROM discussions WHERE parent_id = $1`, parentID).Scan(&total)

	offset := (page - 1) * limit
	rows, err := r.DB.Query(`
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
	return r.scanDiscussions(rows), total, nil
}

func (r *DiscussionRepository) Create(userID, lessonID, courseID string, req models.CreateDiscussionRequest) (*models.Discussion, error) {
	depth := 0
	if req.ParentID != nil {
		r.DB.QueryRow(`SELECT depth FROM discussions WHERE id = $1`, *req.ParentID).Scan(&depth)
		depth++
	}
	var d models.Discussion
	err := r.DB.QueryRow(`
		INSERT INTO discussions (lesson_id, course_id, user_id, parent_id, content, depth)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, lesson_id, course_id, user_id, parent_id, content, depth, reply_count, created_at, updated_at`,
		lessonID, courseID, userID, req.ParentID, req.Content, depth,
	).Scan(&d.ID, &d.LessonID, &d.CourseID, &d.UserID, &d.ParentID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt, &d.UpdatedAt)
	return &d, err
}

func (r *DiscussionRepository) Delete(id, userID string, isAdmin bool) error {
	if isAdmin {
		_, err := r.DB.Exec(`DELETE FROM discussions WHERE id = $1`, id)
		return err
	}
	_, err := r.DB.Exec(`DELETE FROM discussions WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

func (r *DiscussionRepository) scanDiscussions(rows *sql.Rows) []models.DiscussionResponse {
	var list []models.DiscussionResponse
	for rows.Next() {
		var d models.DiscussionResponse
		rows.Scan(&d.ID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt,
			&d.User.ID, &d.User.Name, &d.User.Image)
		list = append(list, d)
	}
	if list == nil {
		list = []models.DiscussionResponse{}
	}
	return list
}
