package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type FeedbackRepository struct {
	DB *sql.DB
}

func NewFeedbackRepository() *FeedbackRepository {
	return &FeedbackRepository{DB: database.DB}
}

func (r *FeedbackRepository) List(userID string, filterByCreator bool) ([]models.Feedback, error) {
	query := `
		SELECT f.id, f.user_id, f.user_name, f.user_email, f.rating, f.course_id, f.course_name, f.message, COALESCE(f.is_pinned, FALSE), f.created_at 
		FROM feedbacks f
	`
	args := []interface{}{}

	if filterByCreator {
		query += ` JOIN courses c ON f.course_id = c.id WHERE c.creator_id = $1`
		args = append(args, userID)
	}
	query += ` ORDER BY f.created_at DESC`

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	feedbacks := []models.Feedback{}
	for rows.Next() {
		var feedback models.Feedback
		if err := rows.Scan(&feedback.ID, &feedback.UserID, &feedback.UserName, &feedback.UserEmail, &feedback.Rating, &feedback.CourseID, &feedback.CourseName, &feedback.Message, &feedback.IsPinned, &feedback.CreatedAt); err != nil {
			return nil, err
		}
		feedback.LegacyID = feedback.ID
		feedbacks = append(feedbacks, feedback)
	}
	return feedbacks, rows.Err()
}

func (r *FeedbackRepository) Create(user *models.User, course *models.CourseDetail, message string, rating int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	newRating := float64(rating)
	if course.Reviews > 0 {
		newRating = ((course.Rating * float64(course.Reviews)) + float64(rating)) / float64(course.Reviews+1)
	}
	if _, err := tx.Exec(`UPDATE courses SET rating = $1, reviews = reviews + 1 WHERE id = $2`, newRating, course.ID); err != nil {
		return err
	}
	if _, err := tx.Exec(`INSERT INTO feedbacks(user_id, user_name, user_email, rating, course_id, course_name, message) VALUES($1, $2, $3, $4, $5, $6, $7)`, user.ID, user.Name, user.Email, rating, course.ID, course.Title, message); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *FeedbackRepository) SetPinned(id int, isPinned bool) error {
	_, err := r.DB.Exec(`UPDATE feedbacks SET is_pinned = $1 WHERE id = $2`, isPinned, id)
	return err
}

func (r *FeedbackRepository) Delete(id int) error {
	_, err := r.DB.Exec(`DELETE FROM feedbacks WHERE id = $1`, id)
	return err
}
