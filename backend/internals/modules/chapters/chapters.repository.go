package chapters

import (
	"fmt"
	"strings"
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
	setClauses := []string{"updated_at = CURRENT_TIMESTAMP"}
	var args []interface{}
	argIdx := 1

	if req.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.ChapterNo != nil {
		setClauses = append(setClauses, fmt.Sprintf("chapter_no = $%d", argIdx))
		args = append(args, *req.ChapterNo)
		argIdx++
	}
	args = append(args, id)
	query := fmt.Sprintf(
		"UPDATE chapters SET %s WHERE id = $%d RETURNING id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at",
		strings.Join(setClauses, ", "), argIdx,
	)
	var ch Chapter
	err := m.DB.QueryRow(query, args...).Scan(
		&ch.ID, &ch.CourseID, &ch.ChapterNo, &ch.Title,
		&ch.TotalLectures, &ch.TotalDurationSeconds, &ch.CreatedAt, &ch.UpdatedAt,
	)
	return &ch, err
}

func (m *ChaptersModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM chapters WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}
