package models

import "time"

type QuizMetadata struct {
	ID               string `json:"id"`
	LessonID         string `json:"lesson_id"`
	Title            string `json:"title"`
	TimeLimitSeconds int    `json:"time_limit_seconds"`
	TotalQuestions   int    `json:"total_questions"`
	PassScorePercent int    `json:"pass_score_percent"`
}

type QuizQuestion struct {
	ID           string  `json:"id"`
	QuizID       string  `json:"quiz_id"`
	QuestionType string  `json:"question_type"`
	QuestionText string  `json:"question_text"`
	Points       int     `json:"points"`
	FillBlankHint *string `json:"fill_blank_hint"`
}

type QuizOption struct {
	ID         string `json:"id"`
	QuestionID string `json:"question_id"`
	OptionText string `json:"option_text"`
	IsCorrect  bool   `json:"is_correct,omitempty"`
}

type QuizArrangeItem struct {
	ID           string `json:"id"`
	QuestionID   string `json:"question_id"`
	ItemText     string `json:"item_text"`
	CorrectOrder int    `json:"correct_order"`
}

type QuizFillBlankAnswer struct {
	ID         string `json:"id"`
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
}

type QuizAttempt struct {
	ID             string     `json:"id"`
	QuizID         string     `json:"quiz_id"`
	UserID         string     `json:"user_id"`
	StartedAt      time.Time  `json:"started_at"`
	SubmittedAt    *time.Time `json:"submitted_at"`
	TotalScore     *float64   `json:"total_score"`
	Passed         *bool      `json:"passed"`
	CorrectCount   int        `json:"correct_count"`
	IncorrectCount int        `json:"incorrect_count"`
	SkippedCount   int        `json:"skipped_count"`
}

type QuizAttemptAnswer struct {
	ID                string   `json:"id"`
	AttemptID         string   `json:"attempt_id"`
	QuestionID        string   `json:"question_id"`
	SelectedOptionIDs []string `json:"selected_option_ids"`
	ArrangeOrder      []int    `json:"arrange_order"`
	FillText          *string  `json:"fill_text"`
	IsSkipped         bool     `json:"is_skipped"`
	IsCorrect         bool     `json:"is_correct"`
}
