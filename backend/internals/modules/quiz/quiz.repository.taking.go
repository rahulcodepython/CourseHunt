package quiz

import (
	"encoding/json"
	"errors"

	"github.com/lib/pq"
)

func (m *QuizModule) ReadNextQuestionUnified(quizID, userID string, fetchedIDs []string) (*QuizQuestion, []QuizOption, []QuizArrangeItem, int, error) {
	exclude := ""
	if len(fetchedIDs) > 0 {
		exclude = " AND qq.id != ALL($3)"
	} else {
		fetchedIDs = []string{} // ensure it's not nil for pq.Array
	}

	query := `
		WITH quiz_info AS (
			SELECT qm.id, ch.course_id
			FROM quiz_metadata qm
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE qm.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN quiz_info qi ON e.course_id = qi.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		selected_question AS (
			SELECT qq.id, qq.quiz_id, qq.question_type, qq.question_text, qq.points, qq.fill_blank_hint 
			FROM quiz_questions qq
			CROSS JOIN enrollment_auth ea
			WHERE qq.quiz_id = $1 AND ea.is_enrolled = true ` + exclude + ` 
			ORDER BY RANDOM() LIMIT 1
		),
		metadata AS (
			SELECT COALESCE(total_questions, 0) as total FROM quiz_metadata WHERE id = $1
		)
		SELECT 
			EXISTS(SELECT 1 FROM quiz_info) AS quiz_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT total FROM metadata) - $4::int AS remaining_count,
			(
				SELECT json_build_object(
					'question', sq.*,
					'options', COALESCE((
						SELECT json_agg(o.* ORDER BY RANDOM()) 
						FROM quiz_options o WHERE o.question_id = sq.id AND sq.question_type IN ('single_choice', 'multi_choice')
					), '[]'::json),
					'arrange_items', COALESCE((
						SELECT json_agg(ai.* ORDER BY RANDOM()) 
						FROM quiz_arrange_items ai WHERE ai.question_id = sq.id AND sq.question_type = 'arrange'
					), '[]'::json)
				)
				FROM selected_question sq
			) AS question_json
	`
	var result struct {
		QuizExists     bool             `db:"quiz_exists"`
		IsEnrolled     bool             `db:"is_enrolled"`
		RemainingCount int              `db:"remaining_count"`
		QuestionJSON   *json.RawMessage `db:"question_json"`
	}

	err := m.DB.Get(&result, query, quizID, userID, pq.Array(fetchedIDs), len(fetchedIDs))
	if err != nil {
		return nil, nil, nil, 0, err
	}

	switch {
	case !result.QuizExists:
		return nil, nil, nil, 0, ErrQuizNotFound
	case !result.IsEnrolled:
		return nil, nil, nil, 0, ErrNotEnrolled
	case result.QuestionJSON == nil:
		return nil, nil, nil, result.RemainingCount, nil
	}

	var parser struct {
		Question     QuizQuestion      `json:"question"`
		Options      []QuizOption      `json:"options"`
		ArrangeItems []QuizArrangeItem `json:"arrange_items"`
	}
	if err := json.Unmarshal(*result.QuestionJSON, &parser); err != nil {
		return nil, nil, nil, 0, err
	}
	return &parser.Question, parser.Options, parser.ArrangeItems, result.RemainingCount, nil
}

func (m *QuizModule) GetQuestionRepository(quizID, userID string, req NextQuestionRequest) (*NextQuestionResponse, error) {
	q, opts, items, remaining, err := m.ReadNextQuestionUnified(quizID, userID, req.FetchedQuestionIDs)
	if err != nil {
		return nil, err
	}

	resp := &NextQuestionResponse{
		RemainingQuestions: remaining,
	}

	if q != nil {
		qResp := &QuestionForAttempt{
			ID:            q.ID,
			QuestionType:  q.QuestionType,
			QuestionText:  q.QuestionText,
			Points:        q.Points,
			FillBlankHint: q.FillBlankHint,
			Options:       []QuizOptionPublic{},
			ArrangeItems:  []QuizArrangeItemPublic{},
		}
		for _, o := range opts {
			qResp.Options = append(qResp.Options, QuizOptionPublic{ID: o.ID, OptionText: o.OptionText})
		}
		for _, it := range items {
			qResp.ArrangeItems = append(qResp.ArrangeItems, QuizArrangeItemPublic{ID: it.ID, ItemText: it.ItemText})
		}
		resp.Question = qResp
	}
	return resp, nil
}

func (m *QuizModule) GetQuizForEvaluationRepository(quizID, userID string) (*QuizEvaluationData, error) {
	query := `
		WITH quiz_info AS (
			SELECT qm.id, ch.course_id
			FROM quiz_metadata qm
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE qm.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN quiz_info qi ON e.course_id = qi.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		)
		SELECT 
			EXISTS(SELECT 1 FROM quiz_info) AS quiz_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			COALESCE(qm.pass_score_percent, 0) AS pass_score_percent,
			COALESCE(
				json_agg(
					json_build_object(
						'id', q.id,
						'question_type', q.question_type,
						'points', q.points,
						'correct_option_ids', (
							SELECT COALESCE(json_agg(o.id), '[]'::json)
							FROM quiz_options o
							WHERE o.question_id = q.id AND o.is_correct = true
						),
						'correct_arrange_order', (
							SELECT COALESCE(json_agg(ai.correct_order ORDER BY ai.correct_order), '[]'::json)
							FROM quiz_arrange_items ai
							WHERE ai.question_id = q.id
						),
						'correct_fill_answers', (
							SELECT COALESCE(json_agg(fba.answer), '[]'::json)
							FROM quiz_fill_blank_answers fba
							WHERE fba.question_id = q.id
						)
					)
				) FILTER (WHERE q.id IS NOT NULL), '[]'::json
			) AS questions
		FROM quiz_metadata qm
		LEFT JOIN quiz_questions q ON q.quiz_id = qm.id
		WHERE qm.id = $1
		GROUP BY qm.id, qm.pass_score_percent
	`

	var validation struct {
		QuizExists       bool            `db:"quiz_exists"`
		IsEnrolled       bool            `db:"is_enrolled"`
		PassScorePercent int             `db:"pass_score_percent"`
		Questions        json.RawMessage `db:"questions"`
	}

	err := m.DB.Get(&validation, query, quizID, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !validation.QuizExists:
		return nil, ErrQuizNotFound
	case !validation.IsEnrolled:
		return nil, ErrNotEnrolled
	}

	var dbQuestions []QuestionValidation
	if err := json.Unmarshal(validation.Questions, &dbQuestions); err != nil {
		return nil, err
	}

	qMap := make(map[string]QuestionValidation)
	for _, q := range dbQuestions {
		qMap[q.ID] = q
	}

	return &QuizEvaluationData{
		PassScorePercent: validation.PassScorePercent,
		Questions:        qMap,
	}, nil
}

func (m *QuizModule) SaveQuizAttemptRepository(quizID, userID string, score float64, passed bool, correctCount, incorrectCount, skippedCount int, answers []AttemptAnswerToSave) (string, error) {
	var insQuestionIDs []string
	var insSelectedOptIDs [][]string
	var insArrangeOrders [][]int64
	var insFillTexts []*string
	var insSkippeds []bool
	var insCorrects []bool

	for _, a := range answers {
		insQuestionIDs = append(insQuestionIDs, a.QuestionID)
		insSelectedOptIDs = append(insSelectedOptIDs, a.SelectedOptionIDs)
		var arrOrder64 []int64
		for _, v := range a.ArrangeOrder {
			arrOrder64 = append(arrOrder64, int64(v))
		}
		insArrangeOrders = append(insArrangeOrders, arrOrder64)
		insFillTexts = append(insFillTexts, a.FillText)
		insSkippeds = append(insSkippeds, a.IsSkipped)
		insCorrects = append(insCorrects, a.IsCorrect)
	}

	query := `
		WITH quiz_info AS (
			SELECT course_id FROM chapters ch 
			JOIN lessons l ON l.chapter_id = ch.id 
			JOIN quiz_metadata qm ON qm.lesson_id = l.id 
			WHERE qm.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e 
				JOIN quiz_info qi ON e.course_id = qi.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) as is_enrolled
		),
		new_attempt AS (
			INSERT INTO quiz_attempts (quiz_id, user_id, submitted_at, total_score, passed, correct_count, incorrect_count, skipped_count)
			SELECT $1, $2, NOW(), $3, $4, $5, $6, $7
			FROM enrollment_auth WHERE is_enrolled = true
			RETURNING id
		),
		inserted_answers AS (
			INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_option_ids, arrange_order, fill_text, is_skipped, is_correct)
			SELECT 
				(SELECT id FROM new_attempt),
				unnest($8::text[]), 
				unnest($9::text[][]), 
				unnest($10::int8[][]), 
				unnest($11::text[]), 
				unnest($12::boolean[]), 
				unnest($13::boolean[])
			WHERE array_length($8::text[], 1) > 0 AND (SELECT id FROM new_attempt) IS NOT NULL
			RETURNING id
		)
		SELECT 
			EXISTS(SELECT 1 FROM quiz_info) AS quiz_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT id FROM new_attempt) AS attempt_id
	`

	var result struct {
		QuizExists bool    `db:"quiz_exists"`
		IsEnrolled bool    `db:"is_enrolled"`
		AttemptID  *string `db:"attempt_id"`
	}

	err := m.DB.Get(&result, query, 
		quizID, userID, score, passed, correctCount, incorrectCount, skippedCount,
		pq.Array(insQuestionIDs), pq.Array(insSelectedOptIDs), pq.Array(insArrangeOrders), pq.Array(insFillTexts), pq.Array(insSkippeds), pq.Array(insCorrects),
	)
	if err != nil {
		return "", err
	}

	switch {
	case !result.QuizExists:
		return "", ErrQuizNotFound
	case !result.IsEnrolled:
		return "", ErrNotEnrolled
	case result.AttemptID == nil:
		return "", errors.New("failed to save attempt")
	}

	return *result.AttemptID, nil
}
