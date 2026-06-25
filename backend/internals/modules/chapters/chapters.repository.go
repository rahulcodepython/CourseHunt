package chapters

import (
	"database/sql"
	"fmt"
)

func (m *ChaptersModule) ListRepository(courseID string) ([]Chapter, error) {
	rows, err := m.DB.Query(`
		SELECT id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at
		FROM chapters WHERE course_id = $1 ORDER BY chapter_no`, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var chapters []Chapter
	for rows.Next() {
		var ch Chapter
		if err := rows.Scan(&ch.ID, &ch.CourseID, &ch.ChapterNo, &ch.Title, &ch.TotalLectures, &ch.TotalDurationSeconds, &ch.CreatedAt, &ch.UpdatedAt); err != nil {
			return nil, err
		}
		chapters = append(chapters, ch)
	}
	if chapters == nil {
		chapters = []Chapter{}
	}
	return chapters, rows.Err()
}

func (m *ChaptersModule) ReadRepository(id string) (*Chapter, error) {
	var ch Chapter
	err := m.DB.QueryRow(`
		SELECT id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at
		FROM chapters WHERE id = $1`, id).
		Scan(&ch.ID, &ch.CourseID, &ch.ChapterNo, &ch.Title, &ch.TotalLectures, &ch.TotalDurationSeconds, &ch.CreatedAt, &ch.UpdatedAt)
	return &ch, err
}

func (m *ChaptersModule) CreateRepository(courseID string, req CreateChapterRequest) (*Chapter, error) {
	var ch Chapter
	err := m.DB.QueryRow(`
		INSERT INTO chapters (course_id, chapter_no, title)
		VALUES ($1, $2, $3)
		RETURNING id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at`,
		courseID, req.ChapterNo, req.Title,
	).Scan(&ch.ID, &ch.CourseID, &ch.ChapterNo, &ch.Title, &ch.TotalLectures, &ch.TotalDurationSeconds, &ch.CreatedAt, &ch.UpdatedAt)
	return &ch, err
}

func (m *ChaptersModule) UpdateRepository(id string, req UpdateChapterRequest) (*Chapter, error) {
	if req.Title != nil {
		m.DB.Exec(`UPDATE chapters SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.Title, id)
	}
	if req.ChapterNo != nil {
		m.DB.Exec(`UPDATE chapters SET chapter_no = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.ChapterNo, id)
	}
	return m.ReadRepository(id)
}

func (m *ChaptersModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM chapters WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}

// GetCourseIDByChapter returns the course_id for ownership checks.
func (m *ChaptersModule) GetCourseIDByChapter(chapterID string) (string, error) {
	var courseID string
	err := m.DB.QueryRow(`SELECT course_id FROM chapters WHERE id = $1`, chapterID).Scan(&courseID)
	return courseID, err
}

// VerifyCourseOwner checks that the given tutorID owns the course.
func (m *ChaptersModule) VerifyCourseOwner(courseID, tutorID string) error {
	var dbTutorID sql.NullString
	if err := m.DB.QueryRow(`SELECT tutor_id FROM courses WHERE id = $1`, courseID).Scan(&dbTutorID); err != nil {
		return fmt.Errorf("course not found")
	}
	if !dbTutorID.Valid || dbTutorID.String != tutorID {
		return fmt.Errorf("forbidden: not course owner")
	}
	return nil
}
