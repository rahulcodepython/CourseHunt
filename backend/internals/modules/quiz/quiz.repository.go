package quiz

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/lib/pq"
)

func (m *QuizModule) CreateMetadataRepository(lessonID string, req CreateQuizRequest) (*QuizMetadata, error) {
	var qm QuizMetadata
	err := m.DB.QueryRow(`
		INSERT INTO quiz_metadata (lesson_id, title, time_limit_seconds, pass_score_percent)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (lesson_id) DO UPDATE SET title = $2, time_limit_seconds = $3, pass_score_percent = $4
		RETURNING id, lesson_id, title, time_limit_seconds, total_questions, pass_score_percent`,
		lessonID, req.Title, req.TimeLimitSeconds, req.PassScorePercent,
	).Scan(&qm.ID, &qm.LessonID, &qm.Title, &qm.TimeLimitSeconds, &qm.TotalQuestions, &qm.PassScorePercent)
	return &qm, err
}

func (m *QuizModule) CreateQuestionRepository(quizID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	tx, err := m.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var q QuizQuestion
	err = tx.QueryRow(`
		INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, fill_blank_hint)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, quiz_id, question_type, question_text, points, fill_blank_hint`,
		quizID, req.QuestionType, req.QuestionText, req.Points, req.FillBlankHint,
	).Scan(&q.ID, &q.QuizID, &q.QuestionType, &q.QuestionText, &q.Points, &q.FillBlankHint)
	if err != nil {
		return nil, err
	}

	for _, opt := range req.Options {
		tx.Exec(`INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES ($1, $2, $3)`, q.ID, opt.OptionText, opt.IsCorrect)
	}
	for _, item := range req.ArrangeItems {
		tx.Exec(`INSERT INTO quiz_arrange_items (question_id, item_text, correct_order) VALUES ($1, $2, $3)`, q.ID, item.ItemText, item.CorrectOrder)
	}
	for _, ans := range req.FillAnswers {
		tx.Exec(`INSERT INTO quiz_fill_blank_answers (question_id, answer) VALUES ($1, $2)`, q.ID, ans)
	}

	return &q, tx.Commit()
}

func (m *QuizModule) DeleteQuestionRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM quiz_questions WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}

func (m *QuizModule) CreateAttemptRepository(tx *sql.Tx, quizID, userID string) (*QuizAttempt, error) {
	var a QuizAttempt
	err := tx.QueryRow(`
		INSERT INTO quiz_attempts (quiz_id, user_id)
		VALUES ($1, $2)
		RETURNING id, quiz_id, user_id, started_at`,
		quizID, userID,
	).Scan(&a.ID, &a.QuizID, &a.UserID, &a.StartedAt)
	return &a, err
}

func (m *QuizModule) ReadNextQuestionUnified(quizID string, fetchedIDs []string) (*QuizQuestion, []QuizOption, []QuizArrangeItem, int, error) {
	var exclude string
	args := []interface{}{quizID}
	if len(fetchedIDs) > 0 {
		exclude = " AND id != ALL($2)"
		args = append(args, pq.Array(fetchedIDs))
	}

	query := `
		WITH selected_question AS (
			SELECT id, quiz_id, question_type, question_text, points, fill_blank_hint 
			FROM quiz_questions 
			WHERE quiz_id = $1 ` + exclude + ` 
			ORDER BY RANDOM() LIMIT 1
		),
		metadata AS (
			SELECT COALESCE(total_questions, 0) as total FROM quiz_metadata WHERE id = $1
		)
		SELECT 
			(SELECT total FROM metadata) - $3::int AS remaining_count,
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

	scanArgs := append(args, len(fetchedIDs))

	var remaining int
	var qJSON []byte

	err := m.DB.QueryRow(query, scanArgs...).Scan(&remaining, &qJSON)
	if err == sql.ErrNoRows || qJSON == nil {
		return nil, nil, nil, remaining, nil
	}
	if err != nil {
		return nil, nil, nil, 0, err
	}

	var parser struct {
		Question     QuizQuestion      `json:"question"`
		Options      []QuizOption      `json:"options"`
		ArrangeItems []QuizArrangeItem `json:"arrange_items"`
	}

	if err := json.Unmarshal(qJSON, &parser); err != nil {
		return nil, nil, nil, 0, err
	}

	return &parser.Question, parser.Options, parser.ArrangeItems, remaining, nil
}

func (m *QuizModule) ReadQuizValidationRepository(quizID string) (int, []QuestionValidation, error) {
	query := `
		SELECT 
			qm.pass_score_percent,
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

	var passScore int
	var questionsJSON []byte
	err := m.DB.QueryRow(query, quizID).Scan(&passScore, &questionsJSON)
	if err != nil {
		return 0, nil, err
	}

	var dbQuestions []QuestionValidation
	if err := json.Unmarshal(questionsJSON, &dbQuestions); err != nil {
		return 0, nil, err
	}

	return passScore, dbQuestions, nil
}

func (m *QuizModule) SaveAttemptAnswersRepository(tx *sql.Tx, attemptID string, questionIDs []string, selectedOptIDs [][]string, arrangeOrders [][]int64, fillTexts []sql.NullString, skippeds []bool, corrects []bool) error {
	if len(questionIDs) > 0 {
		_, err := tx.Exec(`
			INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_option_ids, arrange_order, fill_text, is_skipped, is_correct)
			SELECT $1, unnest($2::text[]), unnest($3::text[][]), unnest($4::int8[][]), unnest($5::text[]), unnest($6::boolean[]), unnest($7::boolean[])`,
			attemptID, pq.Array(questionIDs), pq.Array(selectedOptIDs), pq.Array(arrangeOrders), pq.Array(fillTexts), pq.Array(skippeds), pq.Array(corrects),
		)
		return err
	}
	return nil
}

func (m *QuizModule) UpdateAttemptSummaryRepository(tx *sql.Tx, attemptID string, score float64, passed bool, correctCount, incorrectCount, skippedCount int) error {
	_, err := tx.Exec(`
		UPDATE quiz_attempts SET submitted_at = $1, total_score = $2, passed = $3, correct_count = $4, incorrect_count = $5, skipped_count = $6
		WHERE id = $7`,
		time.Now(), score, passed, correctCount, incorrectCount, skippedCount, attemptID,
	)
	return err
}
