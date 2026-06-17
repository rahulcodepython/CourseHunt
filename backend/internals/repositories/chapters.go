package repositories

import (
	"database/sql"
	"fmt"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type ChapterRepository struct{ DB *sql.DB }

func NewChapterRepository() *ChapterRepository { return &ChapterRepository{DB: database.DB} }

func (r *ChapterRepository) ListByCourse(courseID string) ([]models.Chapter, error) {
	rows, err := r.DB.Query(`
		SELECT id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at
		FROM chapters WHERE course_id = $1 ORDER BY chapter_no`, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var chapters []models.Chapter
	for rows.Next() {
		var ch models.Chapter
		if err := rows.Scan(&ch.ID, &ch.CourseID, &ch.ChapterNo, &ch.Title, &ch.TotalLectures, &ch.TotalDurationSeconds, &ch.CreatedAt, &ch.UpdatedAt); err != nil {
			return nil, err
		}
		chapters = append(chapters, ch)
	}
	if chapters == nil {
		chapters = []models.Chapter{}
	}
	return chapters, rows.Err()
}

func (r *ChapterRepository) FindByID(id string) (*models.Chapter, error) {
	var ch models.Chapter
	err := r.DB.QueryRow(`
		SELECT id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at
		FROM chapters WHERE id = $1`, id).
		Scan(&ch.ID, &ch.CourseID, &ch.ChapterNo, &ch.Title, &ch.TotalLectures, &ch.TotalDurationSeconds, &ch.CreatedAt, &ch.UpdatedAt)
	return &ch, err
}

func (r *ChapterRepository) Create(courseID string, req models.CreateChapterRequest) (*models.Chapter, error) {
	var ch models.Chapter
	err := r.DB.QueryRow(`
		INSERT INTO chapters (course_id, chapter_no, title)
		VALUES ($1, $2, $3)
		RETURNING id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at`,
		courseID, req.ChapterNo, req.Title,
	).Scan(&ch.ID, &ch.CourseID, &ch.ChapterNo, &ch.Title, &ch.TotalLectures, &ch.TotalDurationSeconds, &ch.CreatedAt, &ch.UpdatedAt)
	return &ch, err
}

func (r *ChapterRepository) Update(id string, req models.UpdateChapterRequest) (*models.Chapter, error) {
	if req.Title != nil {
		r.DB.Exec(`UPDATE chapters SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.Title, id)
	}
	if req.ChapterNo != nil {
		r.DB.Exec(`UPDATE chapters SET chapter_no = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.ChapterNo, id)
	}
	return r.FindByID(id)
}

func (r *ChapterRepository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM chapters WHERE id = $1`, id)
	return err
}

// GetCourseIDByChapter returns the course_id for ownership checks.
func (r *ChapterRepository) GetCourseIDByChapter(chapterID string) (string, error) {
	var courseID string
	err := r.DB.QueryRow(`SELECT course_id FROM chapters WHERE id = $1`, chapterID).Scan(&courseID)
	return courseID, err
}

// VerifyCourseOwner checks that the given tutorID owns the course.
func VerifyCourseOwner(db *sql.DB, courseID, tutorID string) error {
	var dbTutorID sql.NullString
	if err := db.QueryRow(`SELECT tutor_id FROM courses WHERE id = $1`, courseID).Scan(&dbTutorID); err != nil {
		return fmt.Errorf("course not found")
	}
	if !dbTutorID.Valid || dbTutorID.String != tutorID {
		return fmt.Errorf("forbidden: not course owner")
	}
	return nil
}
