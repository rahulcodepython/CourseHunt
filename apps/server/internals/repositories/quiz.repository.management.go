package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"encoding/json"
	"errors"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type QuizRepository struct {
	DB              *sqlx.DB
	EnrollmentsRepo *EnrollmentsRepository
	CoursesRepo     *CoursesRepository
	Cache           *cache.Cache
}

func NewQuizRepository(db *sqlx.DB, enrollmentsRepo *EnrollmentsRepository, coursesRepo *CoursesRepository, cache *cache.Cache) *QuizRepository {
	return &QuizRepository{DB: db, EnrollmentsRepo: enrollmentsRepo, CoursesRepo: coursesRepo, Cache: cache}
}

func (r *QuizRepository) CreateMetadataRepository(lessonID, tutorID string, req entities.CreateQuizRequest) (*entities.QuizMetadata, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsOwner      bool             `db:"is_owner"`
		Data         *json.RawMessage `db:"data"`
	}

	query := `
		WITH lesson_auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		inserted AS (
			INSERT INTO quiz_metadata (lesson_id, title, time_limit_seconds, pass_score_percent)
			SELECT $1, $2, $3, $4
			FROM lesson_auth la
			WHERE la.tutor_id = $5
			ON CONFLICT (lesson_id) DO UPDATE SET title = $2, time_limit_seconds = $3, pass_score_percent = $4
			RETURNING id, lesson_id, title, time_limit_seconds, total_questions, pass_score_percent
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_auth) AS lesson_exists,
			EXISTS(SELECT 1 FROM lesson_auth WHERE tutor_id = $5) AS is_owner,
			(SELECT row_to_json(inserted.*) FROM inserted) AS data
	`

	err := r.DB.Get(&result, query, lessonID, req.Title, req.TimeLimitSeconds, req.PassScorePercent, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, generic.ErrQuizLessonNotFound
	case !result.IsOwner:
		return nil, generic.ErrQuizAccessDenied
	case result.Data == nil:
		return nil, errors.New("failed to save quiz")
	}

	var qm entities.QuizMetadata
	if err := json.Unmarshal(*result.Data, &qm); err != nil {
		return nil, err
	}
	return &qm, nil
}

func (r *QuizRepository) ReadMetadataRepository(lessonID, userID string, scope generic.AuthScope) (*entities.QuizMetadata, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsOwner      bool             `db:"is_owner"`
		Data         *json.RawMessage `db:"data"`
	}

	query := `
		WITH lesson_auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_auth) AS lesson_exists,
			CASE WHEN $2::text = 'admin' THEN true ELSE EXISTS(SELECT 1 FROM lesson_auth WHERE tutor_id = $3) END AS is_owner,
			(SELECT row_to_json(qm.*) FROM quiz_metadata qm WHERE qm.lesson_id = $1) AS data
	`
	err := r.DB.Get(&result, query, lessonID, scope, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, generic.ErrQuizLessonNotFound
	case !result.IsOwner:
		return nil, generic.ErrQuizAccessDenied
	case result.Data == nil:
		return nil, generic.ErrQuizNotFound
	}

	var qm entities.QuizMetadata
	if err := json.Unmarshal(*result.Data, &qm); err != nil {
		return nil, err
	}
	return &qm, nil
}

func (r *QuizRepository) ListQuestionsRepository(quizID, userID string, scope generic.AuthScope) ([]entities.QuizQuestionDetail, error) {
	var result struct {
		QuizExists bool             `db:"quiz_exists"`
		IsOwner    bool             `db:"is_owner"`
		Data       *json.RawMessage `db:"data"`
	}

	query := `
		WITH quiz_auth AS (
			SELECT c.tutor_id
			FROM quiz_metadata qm
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE qm.id = $1
		)
		SELECT 
			EXISTS(SELECT 1 FROM quiz_auth) AS quiz_exists,
			CASE WHEN $2::text = 'admin' THEN true ELSE EXISTS(SELECT 1 FROM quiz_auth WHERE tutor_id = $3) END AS is_owner,
			COALESCE((
				SELECT json_agg(
					json_build_object(
						'id', q.id,
						'quiz_id', q.quiz_id,
						'question_type', q.question_type,
						'question_text', q.question_text,
						'points', q.points,
						'fill_blank_hint', q.fill_blank_hint,
						'created_at', q.created_at,
						'updated_at', q.updated_at,
						'options', COALESCE((
							SELECT json_agg(json_build_object(
								'id', o.id,
								'question_id', o.question_id,
								'option_text', o.option_text,
								'is_correct', o.is_correct,
								'sort_order', o.sort_order,
								'created_at', o.created_at
							) ORDER BY o.sort_order)
							FROM quiz_options o WHERE o.question_id = q.id
						), '[]'::json),
						'arrange_items', COALESCE((
							SELECT json_agg(json_build_object(
								'id', ai.id,
								'question_id', ai.question_id,
								'item_text', ai.item_text,
								'correct_order', ai.correct_order,
								'created_at', ai.created_at
							) ORDER BY ai.correct_order)
							FROM quiz_arrange_items ai WHERE ai.question_id = q.id
						), '[]'::json),
						'fill_answers', COALESCE((
							SELECT json_agg(json_build_object(
								'id', fba.id,
								'question_id', fba.question_id,
								'answer', fba.answer,
								'created_at', fba.created_at
							))
							FROM quiz_fill_blank_answers fba WHERE fba.question_id = q.id
						), '[]'::json)
					) ORDER BY q.created_at, q.id
				)
				FROM quiz_questions q WHERE q.quiz_id = $1
			), '[]'::json) AS data
	`
	err := r.DB.Get(&result, query, quizID, scope, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.QuizExists:
		return nil, generic.ErrQuizNotFound
	case !result.IsOwner:
		return nil, generic.ErrQuizAccessDenied
	}

	var questions []entities.QuizQuestionDetail
	if result.Data != nil {
		if err := json.Unmarshal(*result.Data, &questions); err != nil {
			return nil, err
		}
	}
	return questions, nil
}

func (r *QuizRepository) CreateQuestionRepository(quizID, tutorID string, req entities.CreateQuestionRequest) (*entities.QuizQuestion, error) {
	var optTexts []string
	var optCorrects []bool
	for _, o := range req.Options {
		optTexts = append(optTexts, o.OptionText)
		optCorrects = append(optCorrects, o.IsCorrect)
	}

	var arrTexts []string
	var arrOrders []int64
	for _, a := range req.ArrangeItems {
		arrTexts = append(arrTexts, a.ItemText)
		arrOrders = append(arrOrders, int64(a.CorrectOrder))
	}

	query := `
		WITH question_auth AS (
			SELECT c.tutor_id
			FROM quiz_metadata qm
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE qm.id = $1
		),
		inserted_question AS (
			INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, fill_blank_hint)
			SELECT $1, $3, $4, $5, $6
			FROM question_auth qa
			WHERE qa.tutor_id = $2
			RETURNING id, quiz_id, question_type, question_text, points, fill_blank_hint
		),
		inserted_options AS (
			INSERT INTO quiz_options (question_id, option_text, is_correct)
			SELECT i.id, unnest($7::text[]), unnest($8::boolean[])
			FROM inserted_question i
			WHERE array_length($7::text[], 1) > 0
			RETURNING id
		),
		inserted_arrange_items AS (
			INSERT INTO quiz_arrange_items (question_id, item_text, correct_order)
			SELECT i.id, unnest($9::text[]), unnest($10::int8[])
			FROM inserted_question i
			WHERE array_length($9::text[], 1) > 0
			RETURNING id
		),
		inserted_fill_answers AS (
			INSERT INTO quiz_fill_blank_answers (question_id, answer)
			SELECT i.id, unnest($11::text[])
			FROM inserted_question i
			WHERE array_length($11::text[], 1) > 0
			RETURNING id
		)
		SELECT 
			EXISTS(SELECT 1 FROM question_auth) AS quiz_exists,
			EXISTS(SELECT 1 FROM question_auth WHERE tutor_id = $2) AS is_owner,
			(SELECT row_to_json(inserted_question.*) FROM inserted_question) AS question_data
	`

	var result struct {
		QuizExists   bool             `db:"quiz_exists"`
		IsOwner      bool             `db:"is_owner"`
		QuestionData *json.RawMessage `db:"question_data"`
	}

	err := r.DB.Get(&result, query,
		quizID, tutorID, req.QuestionType, req.QuestionText, req.Points, req.FillBlankHint,
		pq.Array(optTexts), pq.Array(optCorrects), pq.Array(arrTexts), pq.Array(arrOrders), pq.Array(req.FillAnswers),
	)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.QuizExists:
		return nil, generic.ErrQuizNotFound
	case !result.IsOwner:
		return nil, generic.ErrQuizAccessDenied
	case result.QuestionData == nil:
		return nil, errors.New("failed to save question")
	}

	var q entities.QuizQuestion
	if err := json.Unmarshal(*result.QuestionData, &q); err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *QuizRepository) DeleteQuestionRepository(id, tutorID string) (string, error) {
	var result struct {
		QuestionExists bool    `db:"question_exists"`
		IsOwner        bool    `db:"is_owner"`
		DeletedID      *string `db:"deleted_id"`
	}

	query := `
		WITH question_auth AS (
			SELECT c.tutor_id
			FROM quiz_questions qq
			JOIN quiz_metadata qm ON qm.id = qq.quiz_id
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE qq.id = $1
		),
		deleted AS (
			DELETE FROM quiz_questions qq
			USING question_auth qa
			WHERE qq.id = $1 AND qa.tutor_id = $2
			RETURNING qq.id
		)
		SELECT 
			EXISTS(SELECT 1 FROM question_auth) AS question_exists,
			EXISTS(SELECT 1 FROM question_auth WHERE tutor_id = $2) AS is_owner,
			(SELECT id FROM deleted) AS deleted_id
	`
	err := r.DB.Get(&result, query, id, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case !result.QuestionExists:
		return "", generic.ErrQuizQuestionNotFound
	case !result.IsOwner:
		return "", generic.ErrQuizAccessDenied
	case result.DeletedID == nil:
		return "", errors.New("failed to delete question")
	}

	return *result.DeletedID, nil
}
