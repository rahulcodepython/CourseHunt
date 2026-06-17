package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type NoteRepository struct{ DB *sql.DB }

func NewNoteRepository() *NoteRepository { return &NoteRepository{DB: database.DB} }

func (r *NoteRepository) Upsert(userID, lessonID, courseID, content string) (*models.NoteResponse, error) {
	var n models.NoteResponse
	err := r.DB.QueryRow(`
		INSERT INTO user_notes (user_id, lesson_id, course_id, content, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, lesson_id) DO UPDATE SET content = $4, updated_at = CURRENT_TIMESTAMP
		RETURNING id, content, updated_at`,
		userID, lessonID, courseID, content,
	).Scan(&n.ID, &n.Content, &n.UpdatedAt)
	return &n, err
}

func (r *NoteRepository) Get(userID, lessonID string) (*models.UserNote, error) {
	var n models.UserNote
	err := r.DB.QueryRow(`SELECT id, user_id, lesson_id, course_id, content, updated_at FROM user_notes WHERE user_id = $1 AND lesson_id = $2`, userID, lessonID).
		Scan(&n.ID, &n.UserID, &n.LessonID, &n.CourseID, &n.Content, &n.UpdatedAt)
	return &n, err
}
