package lessons

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

func (m *LessonsModule) ReadRepository(id string) (*Lesson, error) {
	var l Lesson
	err := m.DB.QueryRow(`
		SELECT id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at
		FROM lessons WHERE id = $1`, id).
		Scan(&l.ID, &l.ChapterID, &l.LessonNo, &l.Title, &l.LessonType, &l.ShortDescription, &l.PreviewVideoURL, &l.DurationSeconds, &l.CreatedAt, &l.UpdatedAt)
	return &l, err
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
	if req.Title != nil {
		m.DB.Exec(`UPDATE lessons SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.Title, id)
	}
	if req.LessonNo != nil {
		m.DB.Exec(`UPDATE lessons SET lesson_no = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.LessonNo, id)
	}
	if req.ShortDescription != nil {
		m.DB.Exec(`UPDATE lessons SET short_description = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.ShortDescription, id)
	}
	if req.PreviewVideoURL != nil {
		m.DB.Exec(`UPDATE lessons SET preview_video_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.PreviewVideoURL, id)
	}
	if req.DurationSeconds != nil {
		m.DB.Exec(`UPDATE lessons SET duration_seconds = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *req.DurationSeconds, id)
	}
	return m.ReadRepository(id)
}

func (m *LessonsModule) DeleteRepository(id string) error {
	_, err := m.DB.Exec(`DELETE FROM lessons WHERE id = $1`, id)
	return err
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

func (m *LessonsModule) DeleteResourceRepository(id string) error {
	_, err := m.DB.Exec(`DELETE FROM lesson_resources WHERE id = $1`, id)
	return err
}

// GetChapterIDByLesson returns chapter_id for a lesson.
func (m *LessonsModule) GetChapterIDByLesson(lessonID string) (string, error) {
	var chID string
	err := m.DB.QueryRow(`SELECT chapter_id FROM lessons WHERE id = $1`, lessonID).Scan(&chID)
	return chID, err
}
