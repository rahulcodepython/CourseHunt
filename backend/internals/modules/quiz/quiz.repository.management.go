package quiz

import (
	"encoding/json"
	"errors"

	"github.com/lib/pq"
)

var (
	ErrNotEnrolled      = errors.New("access denied: not enrolled in course")
	ErrAccessDenied     = errors.New("access denied")
	ErrLessonNotFound   = errors.New("lesson not found")
	ErrQuizNotFound     = errors.New("quiz not found")
	ErrQuestionNotFound = errors.New("question not found")
)

func (m *QuizModule) CreateMetadataRepository(lessonID, tutorID string, req CreateQuizRequest) (*QuizMetadata, error) {
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

	err := m.DB.Get(&result, query, lessonID, req.Title, req.TimeLimitSeconds, req.PassScorePercent, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, ErrLessonNotFound
	case !result.IsOwner:
		return nil, ErrAccessDenied
	case result.Data == nil:
		return nil, errors.New("failed to save quiz")
	}

	var qm QuizMetadata
	if err := json.Unmarshal(*result.Data, &qm); err != nil {
		return nil, err
	}
	return &qm, nil
}

func (m *QuizModule) CreateQuestionRepository(quizID, tutorID string, req CreateQuestionRequest) (*QuizQuestion, error) {
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

	err := m.DB.Get(&result, query, 
		quizID, tutorID, req.QuestionType, req.QuestionText, req.Points, req.FillBlankHint,
		pq.Array(optTexts), pq.Array(optCorrects), pq.Array(arrTexts), pq.Array(arrOrders), pq.Array(req.FillAnswers),
	)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.QuizExists:
		return nil, ErrQuizNotFound
	case !result.IsOwner:
		return nil, ErrAccessDenied
	case result.QuestionData == nil:
		return nil, errors.New("failed to save question")
	}

	var q QuizQuestion
	if err := json.Unmarshal(*result.QuestionData, &q); err != nil {
		return nil, err
	}
	return &q, nil
}

func (m *QuizModule) DeleteQuestionRepository(id, tutorID string) (string, error) {
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
	err := m.DB.Get(&result, query, id, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case !result.QuestionExists:
		return "", ErrQuestionNotFound
	case !result.IsOwner:
		return "", ErrAccessDenied
	case result.DeletedID == nil:
		return "", errors.New("failed to delete question")
	}

	return *result.DeletedID, nil
}
