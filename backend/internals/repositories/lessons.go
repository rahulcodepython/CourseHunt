package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type LessonRepository struct{ DB *sql.DB }

func NewLessonRepository() *LessonRepository { return &LessonRepository{DB: database.DB} }

func (r *LessonRepository) ListByChapter(chapterID string) ([]models.Lesson, error) {
	rows, err := r.DB.Query(`
		SELECT id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at
		FROM lessons WHERE chapter_id = $1 ORDER BY lesson_no`, chapterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var lessons []models.Lesson
	for rows.Next() {
		var l models.Lesson
		if err := rows.Scan(&l.ID, &l.ChapterID, &l.LessonNo, &l.Title, &l.LessonType, &l.ShortDescription, &l.PreviewVideoURL, &l.DurationSeconds, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		lessons = append(lessons, l)
	}
	if lessons == nil {
		lessons = []models.Lesson{}
	}
	return lessons, rows.Err()
}

func (r *LessonRepository) FindByID(id string) (*models.Lesson, error) {
	var l models.Lesson
	err := r.DB.QueryRow(`
		SELECT id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at
		FROM lessons WHERE id = $1`, id).
		Scan(&l.ID, &l.ChapterID, &l.LessonNo, &l.Title, &l.LessonType, &l.ShortDescription, &l.PreviewVideoURL, &l.DurationSeconds, &l.CreatedAt, &l.UpdatedAt)
	return &l, err
}

func (r *LessonRepository) Create(chapterID string, req models.CreateLessonRequest) (*models.Lesson, error) {
	var l models.Lesson
	err := r.DB.QueryRow(`
		INSERT INTO lessons (chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at`,
		chapterID, req.LessonNo, req.Title, req.LessonType, req.ShortDescription, req.PreviewVideoURL, req.DurationSeconds,
	).Scan(&l.ID, &l.ChapterID, &l.LessonNo, &l.Title, &l.LessonType, &l.ShortDescription, &l.PreviewVideoURL, &l.DurationSeconds, &l.CreatedAt, &l.UpdatedAt)
	return &l, err
}

func (r *LessonRepository) Update(id string, req models.UpdateLessonRequest) (*models.Lesson, error) {
	if req.Title != nil {
		r.DB.Exec(`UPDATE lessons SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.Title, id)
	}
	if req.LessonNo != nil {
		r.DB.Exec(`UPDATE lessons SET lesson_no = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.LessonNo, id)
	}
	if req.ShortDescription != nil {
		r.DB.Exec(`UPDATE lessons SET short_description = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.ShortDescription, id)
	}
	if req.PreviewVideoURL != nil {
		r.DB.Exec(`UPDATE lessons SET preview_video_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.PreviewVideoURL, id)
	}
	if req.DurationSeconds != nil {
		r.DB.Exec(`UPDATE lessons SET duration_seconds = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.DurationSeconds, id)
	}
	return r.FindByID(id)
}

func (r *LessonRepository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM lessons WHERE id = $1`, id)
	return err
}

// ── Video Content ─────────────────────────────────────────────────────────────

func (r *LessonRepository) UpsertVideoContent(lessonID string, req models.UpsertVideoContentRequest) (*models.LessonVideoContent, error) {
	var vc models.LessonVideoContent
	err := r.DB.QueryRow(`
		INSERT INTO lesson_video_content (lesson_id, video_url, written_content)
		VALUES ($1, $2, $3)
		ON CONFLICT (lesson_id) DO UPDATE SET video_url = $2, written_content = $3
		RETURNING id, lesson_id, video_url, written_content`,
		lessonID, req.VideoURL, req.WrittenContent,
	).Scan(&vc.ID, &vc.LessonID, &vc.VideoURL, &vc.WrittenContent)
	return &vc, err
}

func (r *LessonRepository) GetVideoContent(lessonID string) (*models.LessonVideoContent, error) {
	var vc models.LessonVideoContent
	err := r.DB.QueryRow(`SELECT id, lesson_id, video_url, written_content FROM lesson_video_content WHERE lesson_id = $1`, lessonID).
		Scan(&vc.ID, &vc.LessonID, &vc.VideoURL, &vc.WrittenContent)
	return &vc, err
}

// ── Document Content ──────────────────────────────────────────────────────────

func (r *LessonRepository) UpsertDocumentContent(lessonID, content string) (*models.LessonDocumentContent, error) {
	var dc models.LessonDocumentContent
	err := r.DB.QueryRow(`
		INSERT INTO lesson_document_content (lesson_id, content)
		VALUES ($1, $2)
		ON CONFLICT (lesson_id) DO UPDATE SET content = $2
		RETURNING id, lesson_id, content`,
		lessonID, content,
	).Scan(&dc.ID, &dc.LessonID, &dc.Content)
	return &dc, err
}

func (r *LessonRepository) GetDocumentContent(lessonID string) (*models.LessonDocumentContent, error) {
	var dc models.LessonDocumentContent
	err := r.DB.QueryRow(`SELECT id, lesson_id, content FROM lesson_document_content WHERE lesson_id = $1`, lessonID).
		Scan(&dc.ID, &dc.LessonID, &dc.Content)
	return &dc, err
}

// ── Resources ─────────────────────────────────────────────────────────────────

func (r *LessonRepository) AddResource(lessonID string, req models.AddResourceRequest) (*models.LessonResource, error) {
	var res models.LessonResource
	err := r.DB.QueryRow(`
		INSERT INTO lesson_resources (lesson_id, title, file_url, file_type)
		VALUES ($1, $2, $3, $4)
		RETURNING id, lesson_id, title, file_url, file_type`,
		lessonID, req.Title, req.FileURL, req.FileType,
	).Scan(&res.ID, &res.LessonID, &res.Title, &res.FileURL, &res.FileType)
	return &res, err
}

func (r *LessonRepository) ListResources(lessonID string) ([]models.LessonResource, error) {
	rows, err := r.DB.Query(`SELECT id, lesson_id, title, file_url, file_type FROM lesson_resources WHERE lesson_id = $1 ORDER BY id`, lessonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var resources []models.LessonResource
	for rows.Next() {
		var res models.LessonResource
		rows.Scan(&res.ID, &res.LessonID, &res.Title, &res.FileURL, &res.FileType)
		resources = append(resources, res)
	}
	if resources == nil {
		resources = []models.LessonResource{}
	}
	return resources, rows.Err()
}

func (r *LessonRepository) DeleteResource(id string) error {
	_, err := r.DB.Exec(`DELETE FROM lesson_resources WHERE id = $1`, id)
	return err
}

// GetChapterIDByLesson returns chapter_id for a lesson.
func (r *LessonRepository) GetChapterIDByLesson(lessonID string) (string, error) {
	var chID string
	err := r.DB.QueryRow(`SELECT chapter_id FROM lessons WHERE id = $1`, lessonID).Scan(&chID)
	return chID, err
}
