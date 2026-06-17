package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type EnrollmentRepository struct{ DB *sql.DB }

func NewEnrollmentRepository() *EnrollmentRepository { return &EnrollmentRepository{DB: database.DB} }

func (r *EnrollmentRepository) Enroll(userID, courseID string) error {
	_, err := r.DB.Exec(`
		INSERT INTO enrollments (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO UPDATE SET revoked = false`,
		userID, courseID)
	return err
}

func (r *EnrollmentRepository) IsEnrolled(userID, courseID string) bool {
	var exists bool
	r.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND revoked = false)`, userID, courseID).Scan(&exists)
	return exists
}

func (r *EnrollmentRepository) Revoke(userID, courseID string) error {
	_, err := r.DB.Exec(`UPDATE enrollments SET revoked = true WHERE user_id = $1 AND course_id = $2`, userID, courseID)
	return err
}

func (r *EnrollmentRepository) Get(userID, courseID string) (*models.Enrollment, error) {
	var e models.Enrollment
	err := r.DB.QueryRow(`
		SELECT id, user_id, course_id, completion_percent, completed, last_accessed_lesson_id, revoked, enrolled_at
		FROM enrollments WHERE user_id = $1 AND course_id = $2`, userID, courseID).
		Scan(&e.ID, &e.UserID, &e.CourseID, &e.CompletionPercent, &e.Completed, &e.LastAccessedLessonID, &e.Revoked, &e.EnrolledAt)
	return &e, err
}

func (r *EnrollmentRepository) UpdateLastAccessed(userID, courseID, lessonID string) error {
	_, err := r.DB.Exec(`UPDATE enrollments SET last_accessed_lesson_id = $1 WHERE user_id = $2 AND course_id = $3`, lessonID, userID, courseID)
	return err
}

func (r *EnrollmentRepository) MarkLessonComplete(userID, lessonID, courseID string) error {
	_, err := r.DB.Exec(`
		INSERT INTO lesson_progress (user_id, lesson_id, course_id, completed, completed_at)
		VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = CURRENT_TIMESTAMP`,
		userID, lessonID, courseID)
	return err
}

func (r *EnrollmentRepository) GetLessonProgress(userID, lessonID string) bool {
	var completed bool
	r.DB.QueryRow(`SELECT completed FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2`, userID, lessonID).Scan(&completed)
	return completed
}

func (r *EnrollmentRepository) GetChapterProgress(userID, chapterID string) *models.ChapterProgress {
	var cp models.ChapterProgress
	err := r.DB.QueryRow(`SELECT id, user_id, chapter_id, course_id, lessons_completed, completed FROM chapter_progress WHERE user_id = $1 AND chapter_id = $2`, userID, chapterID).
		Scan(&cp.ID, &cp.UserID, &cp.ChapterID, &cp.CourseID, &cp.LessonsCompleted, &cp.Completed)
	if err != nil {
		return &models.ChapterProgress{}
	}
	return &cp
}

func (r *EnrollmentRepository) ListByAdmin(page, limit int) ([]models.Enrollment, int, error) {
	var total int
	r.DB.QueryRow(`SELECT COUNT(*) FROM enrollments`).Scan(&total)
	offset := (page - 1) * limit
	rows, err := r.DB.Query(`
		SELECT id, user_id, course_id, completion_percent, completed, last_accessed_lesson_id, revoked, enrolled_at
		FROM enrollments ORDER BY enrolled_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []models.Enrollment
	for rows.Next() {
		var e models.Enrollment
		rows.Scan(&e.ID, &e.UserID, &e.CourseID, &e.CompletionPercent, &e.Completed, &e.LastAccessedLessonID, &e.Revoked, &e.EnrolledAt)
		list = append(list, e)
	}
	if list == nil {
		list = []models.Enrollment{}
	}
	return list, total, rows.Err()
}
