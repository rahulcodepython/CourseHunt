package repositories

import (
	"database/sql"
	"encoding/json"
	"strings"
	"time"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"

	"github.com/lib/pq"
)

type QuizRepository struct{ DB *sql.DB }

func NewQuizRepository() *QuizRepository { return &QuizRepository{DB: database.DB} }

func (r *QuizRepository) CreateMetadata(lessonID string, req models.CreateQuizRequest) (*models.QuizMetadata, error) {
	var qm models.QuizMetadata
	err := r.DB.QueryRow(`
		INSERT INTO quiz_metadata (lesson_id, title, time_limit_seconds, pass_score_percent)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (lesson_id) DO UPDATE SET title = $2, time_limit_seconds = $3, pass_score_percent = $4
		RETURNING id, lesson_id, title, time_limit_seconds, total_questions, pass_score_percent`,
		lessonID, req.Title, req.TimeLimitSeconds, req.PassScorePercent,
	).Scan(&qm.ID, &qm.LessonID, &qm.Title, &qm.TimeLimitSeconds, &qm.TotalQuestions, &qm.PassScorePercent)
	return &qm, err
}

func (r *QuizRepository) GetMetadataByLesson(lessonID string) (*models.QuizMetadata, error) {
	var qm models.QuizMetadata
	err := r.DB.QueryRow(`SELECT id, lesson_id, title, time_limit_seconds, total_questions, pass_score_percent FROM quiz_metadata WHERE lesson_id = $1`, lessonID).
		Scan(&qm.ID, &qm.LessonID, &qm.Title, &qm.TimeLimitSeconds, &qm.TotalQuestions, &qm.PassScorePercent)
	return &qm, err
}

func (r *QuizRepository) AddQuestion(quizID string, req models.CreateQuestionRequest) (*models.QuizQuestion, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var q models.QuizQuestion
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

func (r *QuizRepository) DeleteQuestion(id string) error {
	_, err := r.DB.Exec(`DELETE FROM quiz_questions WHERE id = $1`, id)
	return err
}

// StartAttempt creates a new quiz attempt record.
func (r *QuizRepository) StartAttempt(quizID, userID string) (*models.QuizAttempt, error) {
	var a models.QuizAttempt
	err := r.DB.QueryRow(`
		INSERT INTO quiz_attempts (quiz_id, user_id)
		VALUES ($1, $2)
		RETURNING id, quiz_id, user_id, started_at`,
		quizID, userID,
	).Scan(&a.ID, &a.QuizID, &a.UserID, &a.StartedAt)
	return &a, err
}

// GetAttempt fetches an attempt with ownership check.
func (r *QuizRepository) GetAttempt(attemptID, userID string) (*models.QuizAttempt, error) {
	var a models.QuizAttempt
	err := r.DB.QueryRow(`
		SELECT id, quiz_id, user_id, started_at, submitted_at, total_score, passed, correct_count, incorrect_count, skipped_count
		FROM quiz_attempts WHERE id = $1 AND user_id = $2`, attemptID, userID).
		Scan(&a.ID, &a.QuizID, &a.UserID, &a.StartedAt, &a.SubmittedAt, &a.TotalScore, &a.Passed, &a.CorrectCount, &a.IncorrectCount, &a.SkippedCount)
	return &a, err
}

// GetNextQuestion returns a random question not yet fetched.
func (r *QuizRepository) GetNextQuestion(quizID string, fetchedIDs []string) (*models.QuizQuestion, []models.QuizOption, []models.QuizArrangeItem, error) {
	var exclude string
	args := []interface{}{quizID}
	if len(fetchedIDs) > 0 {
		exclude = " AND id != ALL($2)"
		args = append(args, pq.Array(fetchedIDs))
	}
	var q models.QuizQuestion
	err := r.DB.QueryRow(`SELECT id, quiz_id, question_type, question_text, points, fill_blank_hint FROM quiz_questions WHERE quiz_id = $1`+exclude+` ORDER BY RANDOM() LIMIT 1`, args...).
		Scan(&q.ID, &q.QuizID, &q.QuestionType, &q.QuestionText, &q.Points, &q.FillBlankHint)
	if err == sql.ErrNoRows {
		return nil, nil, nil, nil
	}
	if err != nil {
		return nil, nil, nil, err
	}

	var opts []models.QuizOption
	if q.QuestionType == "single_choice" || q.QuestionType == "multi_choice" {
		rows, _ := r.DB.Query(`SELECT id, option_text FROM quiz_options WHERE question_id = $1 ORDER BY RANDOM()`, q.ID)
		defer rows.Close()
		for rows.Next() {
			var o models.QuizOption
			rows.Scan(&o.ID, &o.OptionText)
			opts = append(opts, o)
		}
	}

	var items []models.QuizArrangeItem
	if q.QuestionType == "arrange" {
		rows, _ := r.DB.Query(`SELECT id, item_text, correct_order FROM quiz_arrange_items WHERE question_id = $1 ORDER BY RANDOM()`, q.ID)
		defer rows.Close()
		for rows.Next() {
			var item models.QuizArrangeItem
			rows.Scan(&item.ID, &item.ItemText, &item.CorrectOrder)
			items = append(items, item)
		}
	}
	return &q, opts, items, nil
}

// SubmitAttempt grades the attempt and stores results.
func (r *QuizRepository) SubmitAttempt(attempt *models.QuizAttempt, req models.SubmitQuizRequest) (*models.SubmitQuizResponse, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var resp models.SubmitQuizResponse
	resp.AttemptID = attempt.ID

	totalPoints := 0
	earnedPoints := 0

	for _, ans := range req.Answers {
		isCorrect := false
		if ans.IsSkipped {
			resp.SkippedCount++
		} else {
			// fetch correct answers
			var qType string
			var qPoints int
			tx.QueryRow(`SELECT question_type, points FROM quiz_questions WHERE id = $1`, ans.QuestionID).Scan(&qType, &qPoints)
			totalPoints += qPoints

			resultItem := models.QuizResultItem{QuestionID: ans.QuestionID}

			switch qType {
			case "single_choice", "multi_choice":
				correctRows, _ := tx.Query(`SELECT id FROM quiz_options WHERE question_id = $1 AND is_correct = true`, ans.QuestionID)
				var correctIDs []string
				for correctRows.Next() {
					var cid string
					correctRows.Scan(&cid)
					correctIDs = append(correctIDs, cid)
				}
				correctRows.Close()
				resultItem.CorrectOptionIDs = correctIDs
				isCorrect = equalSets(correctIDs, ans.SelectedOptionIDs)
			case "arrange":
				arrangeRows, _ := tx.Query(`SELECT correct_order FROM quiz_arrange_items WHERE question_id = $1 ORDER BY correct_order`, ans.QuestionID)
				var correctOrder []int
				for arrangeRows.Next() {
					var o int
					arrangeRows.Scan(&o)
					correctOrder = append(correctOrder, o)
				}
				arrangeRows.Close()
				resultItem.CorrectArrangeOrder = correctOrder
				isCorrect = equalIntSlices(correctOrder, ans.ArrangeOrder)
			case "fill_blank":
				fillRows, _ := tx.Query(`SELECT answer FROM quiz_fill_blank_answers WHERE question_id = $1`, ans.QuestionID)
				var answers []string
				for fillRows.Next() {
					var a string
					fillRows.Scan(&a)
					answers = append(answers, a)
				}
				fillRows.Close()
				resultItem.CorrectFillAnswers = answers
				if ans.FillText != nil {
					for _, a := range answers {
						if strings.EqualFold(a, *ans.FillText) {
							isCorrect = true
							break
						}
					}
				}
			}

			if isCorrect {
				resp.CorrectCount++
				earnedPoints += qPoints
			} else {
				resp.IncorrectCount++
			}
			resultItem.IsCorrect = isCorrect
			resp.Results = append(resp.Results, resultItem)
		}

		// store answer
		selectedJSON, _ := json.Marshal(ans.SelectedOptionIDs)
		_ = selectedJSON
		tx.Exec(`
			INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_option_ids, arrange_order, fill_text, is_skipped, is_correct)
			VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			attempt.ID, ans.QuestionID, pq.Array(ans.SelectedOptionIDs), pq.Array(ans.ArrangeOrder), ans.FillText, ans.IsSkipped, isCorrect,
		)
	}

	var passScore int
	tx.QueryRow(`SELECT pass_score_percent FROM quiz_metadata WHERE id = $1`, attempt.QuizID).Scan(&passScore)

	if totalPoints > 0 {
		resp.TotalScore = float64(earnedPoints) / float64(totalPoints) * 100
	}
	resp.Passed = resp.TotalScore >= float64(passScore)

	now := time.Now()
	tx.Exec(`
		UPDATE quiz_attempts SET submitted_at = $1, total_score = $2, passed = $3, correct_count = $4, incorrect_count = $5, skipped_count = $6
		WHERE id = $7`,
		now, resp.TotalScore, resp.Passed, resp.CorrectCount, resp.IncorrectCount, resp.SkippedCount, attempt.ID,
	)

	return &resp, tx.Commit()
}

func (r *QuizRepository) RemainingCount(quizID string, fetchedIDs []string) int {
	var total int
	r.DB.QueryRow(`SELECT total_questions FROM quiz_metadata WHERE id = $1`, quizID).Scan(&total)
	return total - len(fetchedIDs)
}

func equalSets(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	m := map[string]bool{}
	for _, v := range a {
		m[v] = true
	}
	for _, v := range b {
		if !m[v] {
			return false
		}
	}
	return true
}

func equalIntSlices(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
