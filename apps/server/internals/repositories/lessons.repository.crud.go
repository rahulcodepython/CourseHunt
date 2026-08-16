package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"encoding/json"

	"github.com/jmoiron/sqlx"
)

type LessonsRepository struct {
	DB          *sqlx.DB
	CoursesRepo *CoursesRepository
	Cache       *cache.Cache
}

func NewLessonsRepository(db *sqlx.DB, coursesRepo *CoursesRepository, cache *cache.Cache) *LessonsRepository {
	return &LessonsRepository{DB: db, CoursesRepo: coursesRepo, Cache: cache}
}

func (r *LessonsRepository) ListRepository(chapterID, userID string, scope generic.AuthScope) ([]entities.Lesson, error) {
	if scope == generic.ScopeAdmin {
		var lessons []entities.Lesson
		err := r.DB.Select(&lessons, `
			SELECT id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at
			FROM lessons
			WHERE chapter_id = $1
			ORDER BY lesson_no ASC
		`, chapterID)
		if err != nil {
			return nil, err
		}
		if lessons == nil {
			lessons = []entities.Lesson{}
		}
		return lessons, nil
	}

	var result struct {
		ChapterExists bool            `db:"chapter_exists"`
		IsOwner       bool            `db:"is_owner"`
		Data          json.RawMessage `db:"data"`
	}

	query := `
		WITH chapter_auth AS (
			SELECT c.tutor_id
			FROM chapters ch
			JOIN courses c ON c.id = ch.course_id
			WHERE ch.id = $1
		),
		lessons_data AS (
			SELECT l.id, l.chapter_id, l.lesson_no, l.title, l.lesson_type, l.short_description, l.preview_video_url, l.duration_seconds, l.created_at, l.updated_at
			FROM lessons l
			CROSS JOIN chapter_auth ca
			WHERE l.chapter_id = $1 AND ca.tutor_id = $2
			ORDER BY l.lesson_no
		)
		SELECT 
			EXISTS(SELECT 1 FROM chapter_auth) AS chapter_exists,
			EXISTS(SELECT 1 FROM chapter_auth WHERE tutor_id = $2) AS is_owner,
			COALESCE((SELECT json_agg(lessons_data) FROM lessons_data), '[]'::json) AS data
	`
	err := r.DB.Get(&result, query, chapterID, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.ChapterExists:
		return nil, generic.ErrLessonsChapterNotFound
	case !result.IsOwner:
		return nil, generic.ErrLessonsAccessDenied
	}

	var lessons []entities.Lesson
	if err := json.Unmarshal(result.Data, &lessons); err != nil {
		return nil, err
	}
	return lessons, nil
}

func (r *LessonsRepository) CreateRepository(tutorID, chapterID string, req entities.CreateLessonRequest) (*entities.Lesson, error) {
	var result struct {
		CourseTutorID *string          `db:"course_tutor_id"`
		CourseID      *string          `db:"course_id"`
		InsertedData  *json.RawMessage `db:"inserted_data"`
	}

	query := `
		WITH auth AS (
			SELECT c.id AS course_id, c.tutor_id
			FROM chapters ch
			JOIN courses c ON c.id = ch.course_id
			WHERE ch.id = $1
		),
		next_no AS (
			SELECT COALESCE(MAX(lesson_no), 0) + 1 AS n FROM lessons WHERE chapter_id = $1
		),
		inserted AS (
			INSERT INTO lessons (chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds)
			SELECT $1, next_no.n, $2, $3, $4, NULLIF($5, ''), $6
			FROM auth, next_no
			WHERE auth.tutor_id = $7
			RETURNING *
		)
		SELECT
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT id FROM auth) AS course_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true
	`
	err := r.DB.Get(&result, query,
		chapterID, req.Title, req.LessonType, req.ShortDescription, req.PreviewVideoURL, req.DurationSeconds,
		tutorID,
	)
	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, generic.ErrLessonsChapterNotFound
	case result.InsertedData == nil:
		return nil, generic.ErrLessonsAccessDenied
	}

	var l entities.Lesson
	if err := json.Unmarshal(*result.InsertedData, &l); err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *LessonsRepository) UpdateRepository(id, tutorID string, req entities.UpdateLessonRequest) (*entities.Lesson, *entities.LessonFileCleanup, error) {
	args := map[string]interface{}{
		"id":                id,
		"user_id":           tutorID,
		"title":             req.Title,
		"short_description": req.ShortDescription,
		"preview_video_url": req.PreviewVideoURL,
		"duration_seconds":  req.DurationSeconds,
	}

	// preview_video_url uses a three-way CASE rather than COALESCE: a JSON
	// null (nil pointer) still means "leave untouched", but an explicit
	// empty string now means "clear this file" — see the identical pattern
	// (and rationale, including the CAST(... AS text) requirement) in
	// CoursesRepository.UpdateRepository.
	query := `
		WITH auth AS (
			SELECT c.tutor_id, l.preview_video_url AS old_preview_video_url
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = :id
		),
		updated AS (
			UPDATE lessons SET
				title = COALESCE(:title, title),
				short_description = COALESCE(:short_description, short_description),
				preview_video_url = CASE WHEN CAST(:preview_video_url AS text) IS NULL THEN preview_video_url WHEN CAST(:preview_video_url AS text) = '' THEN NULL ELSE CAST(:preview_video_url AS text) END,
				duration_seconds = COALESCE(:duration_seconds, duration_seconds),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = :id AND EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = :user_id)
			RETURNING *
		)
		SELECT
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT old_preview_video_url FROM auth) AS old_preview_video_url,
			row_to_json(updated.*) AS updated_data
		FROM (SELECT 1) dummy
		LEFT JOIN updated ON true
	`

	stmt, err := r.DB.PrepareNamed(query)
	if err != nil {
		return nil, nil, err
	}
	defer stmt.Close()

	var result struct {
		CourseTutorID      *string          `db:"course_tutor_id"`
		OldPreviewVideoURL *string          `db:"old_preview_video_url"`
		UpdatedData        *json.RawMessage `db:"updated_data"`
	}

	if err := stmt.Get(&result, args); err != nil {
		return nil, nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, nil, generic.ErrLessonsLessonNotFound
	case result.UpdatedData == nil:
		return nil, nil, generic.ErrLessonsAccessDenied
	}

	var l entities.Lesson
	if err := json.Unmarshal(*result.UpdatedData, &l); err != nil {
		return nil, nil, err
	}
	cleanup := &entities.LessonFileCleanup{OldPreviewVideoURL: result.OldPreviewVideoURL}
	return &l, cleanup, nil
}

func (r *LessonsRepository) DeleteRepository(id, tutorID string) (string, error) {
	var result struct {
		CourseTutorID *string `db:"course_tutor_id"`
		DeletedID     *string `db:"deleted_id"`
	}

	query := `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		deleted AS (
			DELETE FROM lessons 
			WHERE id = $1 AND EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $2)
			RETURNING id
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT id FROM deleted) AS deleted_id
	`
	err := r.DB.Get(&result, query, id, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case result.CourseTutorID == nil:
		return "", generic.ErrLessonsLessonNotFound
	case result.DeletedID == nil:
		return "", generic.ErrLessonsAccessDenied
	}

	return *result.DeletedID, nil
}
