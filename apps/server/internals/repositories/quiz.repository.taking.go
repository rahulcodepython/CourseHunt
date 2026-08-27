package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"

	"github.com/lib/pq"
)

func (r *QuizRepository) ReadNextQuestionUnifiedRepository(quizID, userID string, fetchedIDs []string) (*entities.QuizQuestion, []entities.QuizOption, []entities.QuizArrangeItem, int, error) {
	exclude := ""
	args := []any{quizID, userID}
	countParam := "$3"
	if len(fetchedIDs) > 0 {
		exclude = " AND qq.id != ALL($3)"
		args = append(args, pq.Array(fetchedIDs))
		countParam = "$4"
	}
	args = append(args, len(fetchedIDs))

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
			(SELECT total FROM metadata) - ` + countParam + `::int AS remaining_count,
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

	err := r.DB.Get(&result, query, args...)
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

// deconflictArrangeOrder guards against the query's ORDER BY RANDOM() shuffle
// landing on the already-correct sequence by chance — swapping the first two
// items whenever that happens so an arrange question never starts pre-solved.
func deconflictArrangeOrder(items []entities.QuizArrangeItem) []entities.QuizArrangeItem {
	if len(items) < 2 {
		return items
	}
	alreadySorted := true
	for i := 1; i < len(items); i++ {
		if items[i-1].CorrectOrder > items[i].CorrectOrder {
			alreadySorted = false
			break
		}
	}
	if alreadySorted {
		items[0], items[1] = items[1], items[0]
	}
	return items
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
		for _, it := range deconflictArrangeOrder(items) {
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

// ListAttemptsRepository returns every past attempt the caller has made on
// this quiz, newest first. Scoped by user_id in the WHERE clause — no
// separate ownership check needed, an arbitrary quiz_id just yields an empty
// list rather than leaking another user's attempts.
func (r *QuizRepository) ListAttemptsRepository(quizID, userID string) ([]entities.QuizAttemptSummary, error) {
	var attempts []entities.QuizAttemptSummary
	err := r.DB.Select(&attempts, `
		SELECT id, started_at, submitted_at, total_score, passed, correct_count, incorrect_count, skipped_count
		FROM quiz_attempts
		WHERE quiz_id = $1 AND user_id = $2
		ORDER BY started_at DESC`,
		quizID, userID,
	)
	if err != nil {
		return nil, err
	}
	return attempts, nil
}

// GetAttemptDetailRepository returns the full per-question breakdown of one
// past attempt: the question text/points, whether it was answered correctly,
// and both the student's answer and the correct answer as display strings —
// resolved per question type (single/multi choice, arrange, fill blank) from
// the already-persisted quiz_attempt_*_answers tables.
func (r *QuizRepository) GetAttemptDetailRepository(attemptID, userID string) (*entities.QuizAttemptDetail, error) {
	query := `
		WITH attempt_check AS (
			SELECT qa.id AS attempt_id, qa.quiz_id, qm.title AS quiz_title, qa.total_score, qa.passed
			FROM quiz_attempts qa
			JOIN quiz_metadata qm ON qm.id = qa.quiz_id
			WHERE qa.id = $1 AND qa.user_id = $2
		),
		single_rows AS (
			SELECT sa.question_id, sa.is_correct, sa.is_skipped,
			       COALESCE(so.option_text, '') AS your_answer,
			       COALESCE((SELECT co.option_text FROM quiz_options co WHERE co.question_id = sa.question_id AND co.is_correct = true LIMIT 1), '') AS correct_answer,
			       COALESCE((
			       	SELECT json_agg(json_build_object(
			       		'option_id', o.id,
			       		'option_text', o.option_text,
			       		'is_correct', o.is_correct,
			       		'is_selected', o.id = sa.selected_option_id
			       	) ORDER BY o.sort_order)
			       	FROM quiz_options o WHERE o.question_id = sa.question_id
			       ), '[]'::json) AS options,
			       '[]'::json AS arrange_items,
			       '[]'::json AS fill_answers
			FROM quiz_attempt_single_answers sa
			JOIN attempt_check ac ON ac.attempt_id = sa.attempt_id
			LEFT JOIN quiz_options so ON so.id = sa.selected_option_id
		),
		multi_rows AS (
			SELECT ma.question_id, ma.is_correct, ma.is_skipped,
			       COALESCE((SELECT string_agg(mo.option_text, ', ') FROM quiz_attempt_multi_answer_options mao JOIN quiz_options mo ON mo.id = mao.selected_option_id WHERE mao.multi_answer_id = ma.id), '') AS your_answer,
			       COALESCE((SELECT string_agg(co.option_text, ', ') FROM quiz_options co WHERE co.question_id = ma.question_id AND co.is_correct = true), '') AS correct_answer,
			       COALESCE((
			       	SELECT json_agg(json_build_object(
			       		'option_id', o.id,
			       		'option_text', o.option_text,
			       		'is_correct', o.is_correct,
			       		'is_selected', EXISTS (
			       			SELECT 1 FROM quiz_attempt_multi_answer_options mao
			       			WHERE mao.multi_answer_id = ma.id AND mao.selected_option_id = o.id
			       		)
			       	) ORDER BY o.sort_order)
			       	FROM quiz_options o WHERE o.question_id = ma.question_id
			       ), '[]'::json) AS options,
			       '[]'::json AS arrange_items,
			       '[]'::json AS fill_answers
			FROM quiz_attempt_multi_answers ma
			JOIN attempt_check ac ON ac.attempt_id = ma.attempt_id
		),
		arrange_rows AS (
			SELECT aa.question_id,
			       bool_and(aa.is_correct) AS is_correct,
			       bool_and(aa.is_skipped) AS is_skipped,
			       string_agg(ai.item_text, ' -> ' ORDER BY aa.submitted_order) AS your_answer,
			       (SELECT string_agg(ai2.item_text, ' -> ' ORDER BY ai2.correct_order) FROM quiz_arrange_items ai2 WHERE ai2.question_id = aa.question_id) AS correct_answer,
			       '[]'::json AS options,
			       COALESCE((
			       	SELECT json_agg(json_build_object(
			       		'item_id', ai3.id,
			       		'item_text', ai3.item_text,
			       		'correct_order', ai3.correct_order,
			       		'submitted_order', aa3.submitted_order
			       	) ORDER BY ai3.correct_order)
			       	FROM quiz_arrange_items ai3
			       	LEFT JOIN quiz_attempt_arrange_answers aa3
			       	  ON aa3.arrange_item_id = ai3.id AND aa3.attempt_id = aa.attempt_id
			       	WHERE ai3.question_id = aa.question_id
			       ), '[]'::json) AS arrange_items,
			       '[]'::json AS fill_answers
			FROM quiz_attempt_arrange_answers aa
			JOIN attempt_check ac ON ac.attempt_id = aa.attempt_id
			JOIN quiz_arrange_items ai ON ai.id = aa.arrange_item_id
			GROUP BY aa.question_id, aa.attempt_id
		),
		fill_rows AS (
			SELECT fa.question_id, fa.is_correct, fa.is_skipped,
			       fa.fill_text AS your_answer,
			       COALESCE((SELECT string_agg(fba.answer, ' / ') FROM quiz_fill_blank_answers fba WHERE fba.question_id = fa.question_id), '') AS correct_answer,
			       '[]'::json AS options,
			       '[]'::json AS arrange_items,
			       COALESCE((
			       	SELECT json_agg(fba2.answer)
			       	FROM quiz_fill_blank_answers fba2 WHERE fba2.question_id = fa.question_id
			       ), '[]'::json) AS fill_answers
			FROM quiz_attempt_fill_answers fa
			JOIN attempt_check ac ON ac.attempt_id = fa.attempt_id
		),
		all_rows AS (
			SELECT * FROM single_rows
			UNION ALL SELECT * FROM multi_rows
			UNION ALL SELECT * FROM arrange_rows
			UNION ALL SELECT * FROM fill_rows
		)
		SELECT
			EXISTS(SELECT 1 FROM attempt_check) AS attempt_exists,
			COALESCE((SELECT quiz_title FROM attempt_check), '') AS quiz_title,
			COALESCE((SELECT total_score FROM attempt_check), 0) AS total_score,
			COALESCE((SELECT passed FROM attempt_check), false) AS passed,
			COALESCE(
				json_agg(
					json_build_object(
						'question_id', ar.question_id,
						'question_type', qq.question_type,
						'question_text', qq.question_text,
						'points', qq.points,
						'is_correct', ar.is_correct,
						'is_skipped', ar.is_skipped,
						'your_answer', ar.your_answer,
						'correct_answer', ar.correct_answer,
						'options', ar.options,
						'arrange_items', ar.arrange_items,
						'fill_answers', ar.fill_answers
					) ORDER BY qq.created_at
				) FILTER (WHERE ar.question_id IS NOT NULL), '[]'::json
			) AS questions
		FROM all_rows ar
		JOIN quiz_questions qq ON qq.id = ar.question_id`

	var result struct {
		AttemptExists bool            `db:"attempt_exists"`
		QuizTitle     string          `db:"quiz_title"`
		TotalScore    float64         `db:"total_score"`
		Passed        bool            `db:"passed"`
		Questions     json.RawMessage `db:"questions"`
	}
	if err := r.DB.Get(&result, query, attemptID, userID); err != nil {
		return nil, err
	}
	if !result.AttemptExists {
		return nil, generic.ErrQuizAttemptNotFound
	}

	var questions []entities.QuizAttemptQuestionBreakdown
	if err := json.Unmarshal(result.Questions, &questions); err != nil {
		return nil, err
	}

	return &entities.QuizAttemptDetail{
		AttemptID:  attemptID,
		QuizTitle:  result.QuizTitle,
		TotalScore: result.TotalScore,
		Passed:     result.Passed,
		Questions:  questions,
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
