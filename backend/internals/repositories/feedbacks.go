package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type FeedbackRepository struct{ DB *sql.DB }

func NewFeedbackRepository() *FeedbackRepository { return &FeedbackRepository{DB: database.DB} }

func (r *FeedbackRepository) Create(userID, courseID string, req models.CreateFeedbackRequest) (*models.Feedback, error) {
	var f models.Feedback
	err := r.DB.QueryRow(`
		INSERT INTO feedbacks (course_id, user_id, rating, content)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (course_id, user_id) DO UPDATE SET rating = $3, content = $4
		RETURNING id, course_id, user_id, rating, content, is_pinned, created_at`,
		courseID, userID, req.Rating, req.Content,
	).Scan(&f.ID, &f.CourseID, &f.UserID, &f.Rating, &f.Content, &f.IsPinned, &f.CreatedAt)
	return &f, err
}

func (r *FeedbackRepository) List(courseID string, page, limit int) ([]models.FeedbackResponse, int, error) {
	where := "1=1"
	args := []interface{}{}
	idx := 1
	if courseID != "" {
		where = "f.course_id = $1"
		args = append(args, courseID)
		idx++
	}
	var total int
	r.DB.QueryRow("SELECT COUNT(*) FROM feedbacks f WHERE "+where, args...).Scan(&total)
	offset := (page - 1) * limit
	args = append(args, limit, offset)
	rows, err := r.DB.Query(`
		SELECT f.id, f.course_id, f.rating, f.content, f.is_pinned, f.created_at,
		       u.id, u.name, u.image
		FROM feedbacks f
		JOIN "user" u ON u.id = f.user_id
		WHERE `+where+`
		ORDER BY f.is_pinned DESC, f.created_at DESC LIMIT $`+itoa(idx)+` OFFSET $`+itoa(idx+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []models.FeedbackResponse
	for rows.Next() {
		var fb models.FeedbackResponse
		rows.Scan(&fb.ID, &fb.CourseID, &fb.Rating, &fb.Content, &fb.IsPinned, &fb.CreatedAt,
			&fb.User.ID, &fb.User.Name, &fb.User.Image)
		list = append(list, fb)
	}
	if list == nil {
		list = []models.FeedbackResponse{}
	}
	return list, total, rows.Err()
}

func (r *FeedbackRepository) Pin(id string, pin bool) error {
	_, err := r.DB.Exec(`UPDATE feedbacks SET is_pinned = $1 WHERE id = $2`, pin, id)
	return err
}

func (r *FeedbackRepository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM feedbacks WHERE id = $1`, id)
	return err
}
