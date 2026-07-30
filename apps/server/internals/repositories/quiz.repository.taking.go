package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"

	"github.com/lib/pq"
)

func (r *QuizRepository) ReadNextQuestionUnifiedRepository(quizID, userID string, fetchedIDs []string) (*entities.QuizQuestion, []entities.QuizOption, []entities.QuizArrangeItem, int, error) {
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
						SELECT json_agg(o.* ORDER BY o.sort_order, RANDOM()) 
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

	err := r.DB.Get(&result, query, quizID, userID, pq.Array(fetchedIDs), len(fetchedIDs))
	if err != nil {
		return nil, nil, nil, 0, err
	}

	switch {
	case !result.QuizExists:
		return nil, nil, nil, 0, generic.ErrQuizNotFound
	case !result.IsEnrolled:
		return nil, nil, nil, 0, generic.ErrQuizNotEnrolled
	case result.QuestionJSON == nil:
		return nil, nil, nil, result.RemainingCount, nil
	}

	var parser struct {
		Question     entities.QuizQuestion      `json:"question"`
		Options      []entities.QuizOption      `json:"options"`
		ArrangeItems []entities.QuizArrangeItem `json:"arrange_items"`
	}
	if err := json.Unmarshal(*result.QuestionJSON, &parser); err != nil {
		return nil, nil, nil, 0, err
	}
	return &parser.Question, parser.Options, parser.ArrangeItems, result.RemainingCount, nil
}

func (r *QuizRepository) GetQuestionRepository(quizID, userID string, req entities.NextQuestionRequest) (*entities.NextQuestionResponse, error) {
	q, opts, items, remaining, err := r.ReadNextQuestionUnifiedRepository(quizID, userID, req.FetchedQuestionIDs)
	if err != nil {
		return nil, err
	}

	resp := &entities.NextQuestionResponse{
		RemainingQuestions: remaining,
	}

	if q != nil {
		qResp := &entities.QuestionForAttempt{
			ID:            q.ID,
			QuestionType:  q.QuestionType,
			QuestionText:  q.QuestionText,
			Points:        q.Points,
			FillBlankHint: q.FillBlankHint,
			Options:       []entities.QuizOptionPublic{},
			ArrangeItems:  []entities.QuizArrangeItemPublic{},
		}
		for _, o := range opts {
			qResp.Options = append(qResp.Options, entities.QuizOptionPublic{ID: o.ID, OptionText: o.OptionText})
		}
		for _, it := range items {
			qResp.ArrangeItems = append(qResp.ArrangeItems, entities.QuizArrangeItemPublic{ID: it.ID, ItemText: it.ItemText})
		}
		resp.Question = qResp
	}
	return resp, nil
}

func (r *QuizRepository) GetQuizForEvaluationRepository(quizID, userID string) (*entities.QuizEvaluationData, error) {
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
		q_options AS (
			SELECT o.question_id, json_agg(o.id) AS correct_option_ids
			FROM quiz_options o
			JOIN quiz_questions qq ON qq.id = o.question_id
			WHERE qq.quiz_id = $1 AND o.is_correct = true
			GROUP BY o.question_id
		),
		q_arrange AS (
			SELECT ai.question_id, json_agg(ai.correct_order ORDER BY ai.correct_order) AS correct_arrange_order
			FROM quiz_arrange_items ai
			JOIN quiz_questions qq ON qq.id = ai.question_id
			WHERE qq.quiz_id = $1
			GROUP BY ai.question_id
		),
		q_fill AS (
			SELECT fba.question_id, json_agg(fba.answer) AS correct_fill_answers
			FROM quiz_fill_blank_answers fba
			JOIN quiz_questions qq ON qq.id = fba.question_id
			WHERE qq.quiz_id = $1
			GROUP BY fba.question_id
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
						'correct_option_ids', COALESCE(qo.correct_option_ids, '[]'::json),
						'correct_arrange_order', COALESCE(qa.correct_arrange_order, '[]'::json),
						'correct_fill_answers', COALESCE(qf.correct_fill_answers, '[]'::json)
					)
				) FILTER (WHERE q.id IS NOT NULL), '[]'::json
			) AS questions
		FROM quiz_metadata qm
		LEFT JOIN quiz_questions q ON q.quiz_id = qm.id
		LEFT JOIN q_options qo ON qo.question_id = q.id
		LEFT JOIN q_arrange qa ON qa.question_id = q.id
		LEFT JOIN q_fill qf ON qf.question_id = q.id
		WHERE qm.id = $1
		GROUP BY qm.id, qm.pass_score_percent
	`

	var validation struct {
		QuizExists       bool            `db:"quiz_exists"`
		IsEnrolled       bool            `db:"is_enrolled"`
		PassScorePercent int             `db:"pass_score_percent"`
		Questions        json.RawMessage `db:"questions"`
	}

	err := r.DB.Get(&validation, query, quizID, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !validation.QuizExists:
		return nil, generic.ErrQuizNotFound
	case !validation.IsEnrolled:
		return nil, generic.ErrQuizNotEnrolled
	}

	var dbQuestions []entities.QuestionValidation
	if err := json.Unmarshal(validation.Questions, &dbQuestions); err != nil {
		return nil, err
	}

	qMap := make(map[string]entities.QuestionValidation)
	for _, q := range dbQuestions {
		qMap[q.ID] = q
	}

	return &entities.QuizEvaluationData{
		PassScorePercent: validation.PassScorePercent,
		Questions:        qMap,
	}, nil
}

type QuizAnswersToSave struct {
	SingleAnswers []entities.QuizAttemptSingleAnswer
	MultiAnswers  []struct {
		Answer            entities.QuizAttemptMultiAnswer
		SelectedOptionIDs []string
	}
	ArrangeAnswers []entities.QuizAttemptArrangeAnswer
	FillAnswers    []entities.QuizAttemptFillAnswer
}

func (r *QuizRepository) SaveQuizAttemptRepository(quizID, userID string, score float64, passed bool, correctCount, incorrectCount, skippedCount int, answers QuizAnswersToSave) (string, error) {
	tx, err := r.DB.Beginx()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	var isEnrolled bool
	checkQuery := `
		SELECT EXISTS (
			SELECT 1 FROM enrollments e
			JOIN quiz_metadata qm ON qm.id = $1
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE e.user_id = $2 AND e.course_id = ch.course_id AND e.revoked = false
		)
	`
	if err := tx.Get(&isEnrolled, checkQuery, quizID, userID); err != nil {
		return "", err
	}
	if !isEnrolled {
		return "", generic.ErrQuizNotEnrolled
	}

	var attemptID string
	insertAttempt := `
		INSERT INTO quiz_attempts (quiz_id, user_id, submitted_at, total_score, passed, correct_count, incorrect_count, skipped_count)
		VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
		RETURNING id
	`
	if err := tx.Get(&attemptID, insertAttempt, quizID, userID, score, passed, correctCount, incorrectCount, skippedCount); err != nil {
		return "", err
	}

	// 1. Single answers
	for _, sa := range answers.SingleAnswers {
		_, err := tx.Exec(`
			INSERT INTO quiz_attempt_single_answers (attempt_id, question_id, selected_option_id, is_correct, is_skipped)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (attempt_id, question_id) DO NOTHING
		`, attemptID, sa.QuestionID, sa.SelectedOptionID, sa.IsCorrect, sa.IsSkipped)
		if err != nil {
			return "", err
		}
	}

	// 2. Multi answers + junction
	for _, ma := range answers.MultiAnswers {
		var multiAnswerID string
		err := tx.Get(&multiAnswerID, `
			INSERT INTO quiz_attempt_multi_answers (attempt_id, question_id, is_correct, is_skipped)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (attempt_id, question_id) DO UPDATE SET is_correct = EXCLUDED.is_correct
			RETURNING id
		`, attemptID, ma.Answer.QuestionID, ma.Answer.IsCorrect, ma.Answer.IsSkipped)
		if err != nil {
			return "", err
		}

		for _, optID := range ma.SelectedOptionIDs {
			_, err := tx.Exec(`
				INSERT INTO quiz_attempt_multi_answer_options (multi_answer_id, selected_option_id)
				VALUES ($1, $2)
				ON CONFLICT DO NOTHING
			`, multiAnswerID, optID)
			if err != nil {
				return "", err
			}
		}
	}

	// 3. Arrange answers
	for _, aa := range answers.ArrangeAnswers {
		_, err := tx.Exec(`
			INSERT INTO quiz_attempt_arrange_answers (attempt_id, question_id, arrange_item_id, submitted_order, is_correct, is_skipped)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (attempt_id, question_id, arrange_item_id) DO NOTHING
		`, attemptID, aa.QuestionID, aa.ArrangeItemID, aa.SubmittedOrder, aa.IsCorrect, aa.IsSkipped)
		if err != nil {
			return "", err
		}
	}

	// 4. Fill answers
	for _, fa := range answers.FillAnswers {
		_, err := tx.Exec(`
			INSERT INTO quiz_attempt_fill_answers (attempt_id, question_id, fill_text, is_correct, is_skipped)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (attempt_id, question_id) DO NOTHING
		`, attemptID, fa.QuestionID, fa.FillText, fa.IsCorrect, fa.IsSkipped)
		if err != nil {
			return "", err
		}
	}

	if err := tx.Commit(); err != nil {
		return "", err
	}

	return attemptID, nil
}
