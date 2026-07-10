package lessons

import (
	"database/sql"
	"fmt"
	"strings"
)

func (m *LessonsModule) ListRepository(chapterID string) ([]Lesson, error) {
	rows, err := m.DB.Query(`
		SELECT id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at
		FROM lessons WHERE chapter_id = $1 ORDER BY lesson_no`, chapterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var lessons []Lesson
	for rows.Next() {
		var l Lesson
		if err := rows.Scan(&l.ID, &l.ChapterID, &l.LessonNo, &l.Title, &l.LessonType, &l.ShortDescription, &l.PreviewVideoURL, &l.DurationSeconds, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		lessons = append(lessons, l)
	}
	if lessons == nil {
		lessons = []Lesson{}
	}
	return lessons, rows.Err()
}

func (m *LessonsModule) ReadRepository(id, userID string) (*Lesson, bool, error) {
	var l Lesson
	var completed sql.NullBool
	err := m.DB.QueryRow(`
		SELECT l.id, l.chapter_id, l.lesson_no, l.title, l.lesson_type, l.short_description, l.preview_video_url, l.duration_seconds, l.created_at, l.updated_at, lp.completed
		FROM lessons l
		LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
		WHERE l.id = $1`, id, userID).
		Scan(&l.ID, &l.ChapterID, &l.LessonNo, &l.Title, &l.LessonType, &l.ShortDescription, &l.PreviewVideoURL, &l.DurationSeconds, &l.CreatedAt, &l.UpdatedAt, &completed)
	return &l, completed.Bool, err
}

func (m *LessonsModule) CreateRepository(chapterID string, req CreateLessonRequest) (*Lesson, error) {
	var l Lesson
	err := m.DB.QueryRow(`
		INSERT INTO lessons (chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at`,
		chapterID, req.LessonNo, req.Title, req.LessonType, req.ShortDescription, req.PreviewVideoURL, req.DurationSeconds,
	).Scan(&l.ID, &l.ChapterID, &l.LessonNo, &l.Title, &l.LessonType, &l.ShortDescription, &l.PreviewVideoURL, &l.DurationSeconds, &l.CreatedAt, &l.UpdatedAt)
	return &l, err
}

func (m *LessonsModule) UpdateRepository(id string, req UpdateLessonRequest) (*Lesson, error) {
	setClauses := []string{"updated_at = CURRENT_TIMESTAMP"}
	var args []interface{}
	argIdx := 1

	if req.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.LessonNo != nil {
		setClauses = append(setClauses, fmt.Sprintf("lesson_no = $%d", argIdx))
		args = append(args, *req.LessonNo)
		argIdx++
	}
	if req.ShortDescription != nil {
		setClauses = append(setClauses, fmt.Sprintf("short_description = $%d", argIdx))
		args = append(args, *req.ShortDescription)
		argIdx++
	}
	if req.PreviewVideoURL != nil {
		setClauses = append(setClauses, fmt.Sprintf("preview_video_url = $%d", argIdx))
		args = append(args, *req.PreviewVideoURL)
		argIdx++
	}
	if req.DurationSeconds != nil {
		setClauses = append(setClauses, fmt.Sprintf("duration_seconds = $%d", argIdx))
		args = append(args, *req.DurationSeconds)
		argIdx++
	}
	args = append(args, id)
	query := fmt.Sprintf(
		"UPDATE lessons SET %s WHERE id = $%d RETURNING id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at",
		strings.Join(setClauses, ", "), argIdx,
	)
	var l Lesson
	err := m.DB.QueryRow(query, args...).Scan(
		&l.ID, &l.ChapterID, &l.LessonNo, &l.Title, &l.LessonType,
		&l.ShortDescription, &l.PreviewVideoURL, &l.DurationSeconds, &l.CreatedAt, &l.UpdatedAt,
	)
	return &l, err
}

func (m *LessonsModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM lessons WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}

// ── Video Content ─────────────────────────────────────────────────────────────

func (m *LessonsModule) UpsertVideoContentRepository(lessonID string, req UpsertVideoContentRequest) (*LessonVideoContent, error) {
	var vc LessonVideoContent
	err := m.DB.QueryRow(`
		INSERT INTO lesson_video_content (lesson_id, video_url, written_content)
		VALUES ($1, $2, $3)
		ON CONFLICT (lesson_id) DO UPDATE SET video_url = $2, written_content = $3
		RETURNING id, lesson_id, video_url, written_content`,
		lessonID, req.VideoURL, req.WrittenContent,
	).Scan(&vc.ID, &vc.LessonID, &vc.VideoURL, &vc.WrittenContent)
	return &vc, err
}

func (m *LessonsModule) ReadVideoContentRepository(lessonID string) (*LessonVideoContent, error) {
	var vc LessonVideoContent
	err := m.DB.QueryRow(`SELECT id, lesson_id, video_url, written_content FROM lesson_video_content WHERE lesson_id = $1`, lessonID).
		Scan(&vc.ID, &vc.LessonID, &vc.VideoURL, &vc.WrittenContent)
	return &vc, err
}

// ── Document Content ──────────────────────────────────────────────────────────

func (m *LessonsModule) UpsertDocumentContentRepository(lessonID, content string) (*LessonDocumentContent, error) {
	var dc LessonDocumentContent
	err := m.DB.QueryRow(`
		INSERT INTO lesson_document_content (lesson_id, content)
		VALUES ($1, $2)
		ON CONFLICT (lesson_id) DO UPDATE SET content = $2
		RETURNING id, lesson_id, content`,
		lessonID, content,
	).Scan(&dc.ID, &dc.LessonID, &dc.Content)
	return &dc, err
}

func (m *LessonsModule) ReadDocumentContentRepository(lessonID string) (*LessonDocumentContent, error) {
	var dc LessonDocumentContent
	err := m.DB.QueryRow(`SELECT id, lesson_id, content FROM lesson_document_content WHERE lesson_id = $1`, lessonID).
		Scan(&dc.ID, &dc.LessonID, &dc.Content)
	return &dc, err
}

// ── Resources ─────────────────────────────────────────────────────────────────

func (m *LessonsModule) CreateResourceRepository(lessonID string, req AddResourceRequest) (*LessonResource, error) {
	var res LessonResource
	err := m.DB.QueryRow(`
		INSERT INTO lesson_resources (lesson_id, title, file_url, file_type)
		VALUES ($1, $2, $3, $4)
		RETURNING id, lesson_id, title, file_url, file_type`,
		lessonID, req.Title, req.FileURL, req.FileType,
	).Scan(&res.ID, &res.LessonID, &res.Title, &res.FileURL, &res.FileType)
	return &res, err
}

func (m *LessonsModule) ListResourcesRepository(lessonID string) ([]LessonResource, error) {
	rows, err := m.DB.Query(`SELECT id, lesson_id, title, file_url, file_type FROM lesson_resources WHERE lesson_id = $1 ORDER BY id`, lessonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var resources []LessonResource
	for rows.Next() {
		var res LessonResource
		rows.Scan(&res.ID, &res.LessonID, &res.Title, &res.FileURL, &res.FileType)
		resources = append(resources, res)
	}
	if resources == nil {
		resources = []LessonResource{}
	}
	return resources, rows.Err()
}

func (m *LessonsModule) DeleteResourceRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM lesson_resources WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}

// GetChapterIDByLesson returns chapter_id for a lesson.
func (m *LessonsModule) GetChapterIDByLesson(lessonID string) (string, error) {
	var chID string
	err := m.DB.QueryRow(`SELECT chapter_id FROM lessons WHERE id = $1`, lessonID).Scan(&chID)
	return chID, err
}

func (m *LessonsModule) UpdateLastAccessed(userID, courseID, lessonID string) error {
	_, err := m.DB.Exec(`UPDATE enrollments SET last_accessed_lesson_id = $1 WHERE user_id = $2 AND course_id = $3`, lessonID, userID, courseID)
	return err
}

func (m *LessonsModule) MarkLessonComplete(userID, lessonID, courseID string) error {
	_, err := m.DB.Exec(`
		INSERT INTO lesson_progress (user_id, lesson_id, course_id, completed, completed_at)
		VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = CURRENT_TIMESTAMP`,
		userID, lessonID, courseID)
	return err
}
