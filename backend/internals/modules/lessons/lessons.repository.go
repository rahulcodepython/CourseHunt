package lessons

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"coursehunt-backend/internals/modules/quiz"
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

func (m *LessonsModule) ReadContentAggregatedRepository(lessonID, userID string) (interface{}, error) {
	var lessonType string
	var videoContentID, videoURL, writtenContent, documentContentID, documentContent sql.NullString
	var quizMetadataJSON []byte

	query := `
		SELECT 
			l.lesson_type,
			vc.id AS video_content_id, vc.video_url, vc.written_content,
			dc.id AS document_content_id, dc.content AS document_content,
			CASE WHEN qm.id IS NOT NULL THEN json_build_object(
				'id', qm.id,
				'lesson_id', qm.lesson_id,
				'title', qm.title,
				'time_limit_seconds', qm.time_limit_seconds,
				'total_questions', qm.total_questions,
				'pass_score_percent', qm.pass_score_percent
			) ELSE NULL END AS quiz_metadata
		FROM lessons l
		LEFT JOIN lesson_video_content vc ON vc.lesson_id = l.id AND l.lesson_type = 'video'
		LEFT JOIN lesson_document_content dc ON dc.lesson_id = l.id AND l.lesson_type = 'document'
		LEFT JOIN quiz_metadata qm ON qm.lesson_id = l.id AND l.lesson_type = 'quiz'
		WHERE l.id = $1
	`
	err := m.DB.QueryRow(query, lessonID).Scan(
		&lessonType,
		&videoContentID, &videoURL, &writtenContent,
		&documentContentID, &documentContent,
		&quizMetadataJSON,
	)
	if err != nil {
		return nil, err
	}

	switch lessonType {
	case "video":
		var vc LessonVideoContent
		if videoContentID.Valid {
			vc.ID = videoContentID.String
		}
		if videoURL.Valid {
			vc.VideoURL = videoURL.String
		}
		if writtenContent.Valid {
			vc.WrittenContent = &writtenContent.String
		}
		return &LessonContentResponse[LessonVideoContent]{
			Content: &vc,
		}, nil
	case "document":
		var dc LessonDocumentContent
		if documentContentID.Valid {
			dc.ID = documentContentID.String
		}
		if documentContent.Valid {
			dc.Content = documentContent.String
		}
		return &LessonContentResponse[LessonDocumentContent]{
			Content: &dc,
		}, nil
	case "quiz":
		if quizMetadataJSON != nil {
			var qm quiz.QuizMetadata
			if err := json.Unmarshal(quizMetadataJSON, &qm); err == nil {
				return &LessonContentResponse[quiz.QuizMetadata]{
					Content: &qm,
				}, nil
			}
		}
		return &LessonContentResponse[quiz.QuizMetadata]{
			Content: nil,
		}, nil
	default:
		return nil, fmt.Errorf("unknown lesson type: %s", lessonType)
	}
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
		RETURNING id, video_url, written_content`,
		lessonID, req.VideoURL, req.WrittenContent,
	).Scan(&vc.ID, &vc.VideoURL, &vc.WrittenContent)
	return &vc, err
}

// ── Document Content ──────────────────────────────────────────────────────────

func (m *LessonsModule) UpsertDocumentContentRepository(lessonID, content string) (*LessonDocumentContent, error) {
	var dc LessonDocumentContent
	err := m.DB.QueryRow(`
		INSERT INTO lesson_document_content (lesson_id, content)
		VALUES ($1, $2)
		ON CONFLICT (lesson_id) DO UPDATE SET content = $2
		RETURNING id, content`,
		lessonID, content,
	).Scan(&dc.ID, &dc.Content)
	return &dc, err
}

// ── Resources ─────────────────────────────────────────────────────────────────

func (m *LessonsModule) CreateResourceRepository(lessonID string, req AddResourceRequest) (*LessonResource, error) {
	var res LessonResource
	err := m.DB.QueryRow(`
		INSERT INTO lesson_resources (lesson_id, title, file_url, file_type)
		VALUES ($1, $2, $3, $4)
		RETURNING id, title, file_url, file_type`,
		lessonID, req.Title, req.FileURL, req.FileType,
	).Scan(&res.ID, &res.Title, &res.FileURL, &res.FileType)
	return &res, err
}

func (m *LessonsModule) ListResourcesRepository(lessonID string) ([]LessonResource, error) {
	rows, err := m.DB.Query(`SELECT id, title, file_url, file_type FROM lesson_resources WHERE lesson_id = $1 ORDER BY id`, lessonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var resources []LessonResource
	for rows.Next() {
		var res LessonResource
		rows.Scan(&res.ID, &res.Title, &res.FileURL, &res.FileType)
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
