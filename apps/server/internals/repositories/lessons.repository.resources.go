package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"
)

// ── Resources ──

func (r *LessonsRepository) CreateResourceRepository(lessonID, tutorID string, req entities.AddResourceRequest) (*entities.LessonResource, error) {
	var result struct {
		CourseTutorID *string          `db:"course_tutor_id"`
		InsertedData  *json.RawMessage `db:"inserted_data"`
	}

	query := `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		inserted AS (
			INSERT INTO lesson_resources (lesson_id, title, file_url, file_type)
			SELECT $1, $2, $3, $4
			WHERE EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $5)
			RETURNING id, title, file_url, file_type
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true
	`
	err := r.DB.Get(&result, query, lessonID, req.Title, req.FileURL, req.FileType, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, generic.ErrLessonsLessonNotFound
	case result.InsertedData == nil:
		return nil, generic.ErrLessonsAccessDenied
	}

	var res entities.LessonResource
	if err := json.Unmarshal(*result.InsertedData, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

func (r *LessonsRepository) DeleteResourceRepository(resourceID, tutorID string) (string, string, error) {
	var result struct {
		CourseTutorID *string `db:"course_tutor_id"`
		DeletedID     *string `db:"deleted_id"`
		DeletedFile   *string `db:"deleted_file_url"`
	}

	query := `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lesson_resources lr
			JOIN lessons l ON l.id = lr.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE lr.id = $1
		),
		deleted AS (
			DELETE FROM lesson_resources
			WHERE id = $1 AND EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $2)
			RETURNING id, file_url
		)
		SELECT
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT id FROM deleted) AS deleted_id,
			(SELECT file_url FROM deleted) AS deleted_file_url
	`
	err := r.DB.Get(&result, query, resourceID, tutorID)
	if err != nil {
		return "", "", err
	}

	switch {
	case result.CourseTutorID == nil:
		return "", "", generic.ErrLessonsResourceNotFound
	case result.DeletedID == nil:
		return "", "", generic.ErrLessonsAccessDenied
	}

	fileURL := ""
	if result.DeletedFile != nil {
		fileURL = *result.DeletedFile
	}
	return *result.DeletedID, fileURL, nil
}

// ReadResourcesForTutorRepository is the tutor-authoring counterpart to
// ReadResourcesRepository: gated by course ownership instead of enrollment.
func (r *LessonsRepository) ReadResourcesForTutorRepository(lessonID, tutorID string) ([]entities.LessonResource, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsOwner      bool             `db:"is_owner"`
		Resources    *json.RawMessage `db:"resources"`
	}

	query := `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		resources_cte AS (
			SELECT lr.id, lr.lesson_id, lr.title, lr.file_url, lr.file_type
			FROM lesson_resources lr
			JOIN lesson_info li ON li.lesson_id = lr.lesson_id
			WHERE li.tutor_id = $2
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			EXISTS(SELECT 1 FROM lesson_info WHERE tutor_id = $2) AS is_owner,
			(SELECT json_agg(resources_cte) FROM resources_cte) AS resources
	`
	err := r.DB.Get(&result, query, lessonID, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, generic.ErrLessonsLessonNotFound
	case !result.IsOwner:
		return nil, generic.ErrLessonsAccessDenied
	}

	var list []entities.LessonResource
	if result.Resources != nil {
		if err := json.Unmarshal(*result.Resources, &list); err != nil {
			return nil, err
		}
	} else {
		list = []entities.LessonResource{}
	}

	return list, nil
}

func (r *LessonsRepository) ReadResourcesRepository(lessonID, userID string, scope generic.AuthScope) ([]entities.LessonResource, error) {
	if scope == generic.ScopeAdmin {
		var list []entities.LessonResource
		err := r.DB.Select(&list, `
			SELECT id, lesson_id, title, file_url, file_type
			FROM lesson_resources
			WHERE lesson_id = $1
		`, lessonID)
		if err != nil {
			return nil, err
		}
		if list == nil {
			list = []entities.LessonResource{}
		}
		return list, nil
	}

	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsEnrolled   bool             `db:"is_enrolled"`
		Resources    *json.RawMessage `db:"resources"`
	}

	query := `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		resources_cte AS (
			SELECT lr.id, lr.lesson_id, lr.title, lr.file_url, lr.file_type
			FROM lesson_resources lr
			JOIN enrollment_auth ea ON ea.is_enrolled = true
			WHERE lr.lesson_id = $1
		)
		SELECT 
			EXISTS (SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT json_agg(resources_cte) FROM resources_cte) AS resources
	`
	err := r.DB.Get(&result, query, lessonID, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, generic.ErrLessonsLessonNotFound
	case !result.IsEnrolled:
		return nil, generic.ErrLessonsNotEnrolled
	}

	var list []entities.LessonResource
	if result.Resources != nil {
		if err := json.Unmarshal(*result.Resources, &list); err != nil {
			return nil, err
		}
	} else {
		list = []entities.LessonResource{}
	}

	return list, nil
}
