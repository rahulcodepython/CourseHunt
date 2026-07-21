package chapters

import (
	"encoding/json"
	"errors"

	"coursehunt/api/internals/generic"
)

// Explicit, granular domain errors
var (
	ErrCourseNotFound  = errors.New("course not found")
	ErrUnauthorized    = errors.New("access denied: you are not the tutor of this course")
	ErrChapterNotFound = errors.New("chapter not found")
)

func (m *ChaptersModule) ListRepository(courseID, userID string, scope generic.AuthScope) ([]Chapter, error) {
	switch scope {
	case generic.ScopeAdmin:
		var chapters []Chapter
		err := m.DB.Select(&chapters, `
			SELECT id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at
			FROM chapters
			WHERE course_id = $1
			ORDER BY chapter_no ASC
		`, courseID)
		if err != nil {
			return nil, err
		}
		if chapters == nil {
			chapters = []Chapter{}
		}
		return chapters, nil

	default:
		query := `
			WITH auth_check AS (
				SELECT
					CASE
						WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1) THEN 0
						WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1 AND tutor_id = $2) THEN 1
						ELSE 2
					END as status_code
			)
			SELECT
				ac.status_code AS status_flag,
				COALESCE(
					(
						SELECT json_agg(
							json_build_object(
								'id', ch.id,
								'course_id', ch.course_id,
								'chapter_no', ch.chapter_no,
								'title', ch.title,
								'total_lectures', ch.total_lectures,
								'total_duration_seconds', ch.total_duration_seconds,
								'created_at', ch.created_at,
								'updated_at', ch.updated_at
							) ORDER BY ch.chapter_no ASC
						)
						FROM chapters ch
						WHERE ch.course_id = $1
					), '[]'::json
				) AS data_json
			FROM auth_check ac`

		var res struct {
			StatusFlag int    `db:"status_flag"`
			DataJSON   []byte `db:"data_json"`
		}

		if err := m.DB.Get(&res, query, courseID, userID); err != nil {
			return nil, err
		}

		switch res.StatusFlag {
		case 0:
			return nil, ErrCourseNotFound
		case 1:
			return nil, ErrUnauthorized
		default:
			var chapters []Chapter
			if err := json.Unmarshal(res.DataJSON, &chapters); err != nil {
				return nil, err
			}
			return chapters, nil
		}
	}
}

func (m *ChaptersModule) CreateRepository(userID, courseID string, req CreateChapterRequest) (*Chapter, error) {
	query := `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1) THEN 0
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1 AND tutor_id = $2) THEN 1
					ELSE 2
				END as status_code
		),
		inserted AS (
			INSERT INTO chapters (course_id, chapter_no, title)
			SELECT $1, $3, $4
			FROM status_check
			WHERE status_check.status_code = 2
			RETURNING id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(
					SELECT json_build_object(
						'id', i.id,
						'course_id', i.course_id,
						'chapter_no', i.chapter_no,
						'title', i.title,
						'total_lectures', i.total_lectures,
						'total_duration_seconds', i.total_duration_seconds,
						'created_at', i.created_at,
						'updated_at', i.updated_at
					) FROM inserted i
				), '{}'::json
			) AS data_json
		FROM status_check sc;`

	var res struct {
		StatusFlag int    `db:"status_flag"`
		DataJSON   []byte `db:"data_json"`
	}

	if err := m.DB.Get(&res, query, courseID, userID, req.ChapterNo, req.Title); err != nil {
		return nil, err
	}

	switch res.StatusFlag {
	case 0:
		return nil, ErrCourseNotFound
	case 1:
		return nil, ErrUnauthorized
	default:
		var chapter Chapter
		if err := json.Unmarshal(res.DataJSON, &chapter); err != nil {
			return nil, err
		}
		return &chapter, nil
	}
}

func (m *ChaptersModule) UpdateRepository(id, userID string, req UpdateChapterRequest) (*Chapter, error) {
	query := `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM chapters WHERE id = :id) THEN 0
					WHEN NOT EXISTS(
						SELECT 1 FROM chapters ch
						JOIN courses co ON ch.course_id = co.id
						WHERE ch.id = :id AND co.tutor_id = :user_id
					) THEN 1
					ELSE 2
				END as status_code
		),
		updated AS (
			UPDATE chapters ch
			SET
				title = COALESCE(:title, title),
				chapter_no = COALESCE(:chapter_no, chapter_no),
				updated_at = CURRENT_TIMESTAMP
			FROM courses co
			WHERE ch.course_id = co.id AND co.tutor_id = :user_id AND ch.id = :id
			RETURNING ch.id, ch.course_id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds, ch.created_at, ch.updated_at
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(
					SELECT json_build_object(
						'id', u.id,
						'course_id', u.course_id,
						'chapter_no', u.chapter_no,
						'title', u.title,
						'total_lectures', u.total_lectures,
						'total_duration_seconds', u.total_duration_seconds,
						'created_at', u.created_at,
						'updated_at', u.updated_at
					) FROM updated u
				), '{}'::json
			) AS data_json
		FROM status_check sc;`

	args := map[string]interface{}{
		"id":         id,
		"title":      req.Title,
		"chapter_no": req.ChapterNo,
		"user_id":    userID,
	}

	stmt, err := m.DB.PrepareNamed(query)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	var res struct {
		StatusFlag int    `db:"status_flag"`
		DataJSON   []byte `db:"data_json"`
	}

	if err := stmt.Get(&res, args); err != nil {
		return nil, err
	}

	switch res.StatusFlag {
	case 0:
		return nil, ErrChapterNotFound
	case 1:
		return nil, ErrUnauthorized
	default:
		var chapter Chapter
		if err := json.Unmarshal(res.DataJSON, &chapter); err != nil {
			return nil, err
		}
		return &chapter, nil
	}
}

func (m *ChaptersModule) DeleteRepository(id, userID string) (string, error) {
	query := `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM chapters WHERE id = $1) THEN 0
					WHEN NOT EXISTS(
						SELECT 1 FROM chapters ch
						JOIN courses co ON ch.course_id = co.id
						WHERE ch.id = $1 AND co.tutor_id = $2
					) THEN 1
					ELSE 2
				END as status_code
		),
		deleted AS (
			DELETE FROM chapters ch
			USING courses co
			WHERE ch.course_id = co.id AND co.tutor_id = $2 AND ch.id = $1
			RETURNING ch.id
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(SELECT json_build_object('id', d.id) FROM deleted d), '{}'::json
			) AS data_json
		FROM status_check sc;`

	var res struct {
		StatusFlag int    `db:"status_flag"`
		DataJSON   []byte `db:"data_json"`
	}

	if err := m.DB.Get(&res, query, id, userID); err != nil {
		return "", err
	}

	switch res.StatusFlag {
	case 0:
		return "", ErrChapterNotFound
	case 1:
		return "", ErrUnauthorized
	default:
		var deletedObj struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(res.DataJSON, &deletedObj); err != nil {
			return "", err
		}
		return deletedObj.ID, nil
	}
}


