package quiz

import (
	"time"
)

type QuizMetadata struct {
	ID               string `json:"id"`
	LessonID         string `json:"lesson_id"`
	Title            string `json:"title"`
	TimeLimitSeconds int    `json:"time_limit_seconds"`
	TotalQuestions   int    `json:"total_questions"`
	PassScorePercent int    `json:"pass_score_percent"`
}

type QuizQuestion struct {
	ID            string  `json:"id"`
	QuizID        string  `json:"quiz_id"`
	QuestionType  string  `json:"question_type"`
	QuestionText  string  `json:"question_text"`
	Points        int     `json:"points"`
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

type QuestionValidation struct {
	ID                  string   `json:"id"`
	QuestionType        string   `json:"question_type"`
	Points              int      `json:"points"`
	CorrectOptionIDs    []string `json:"correct_option_ids"`
	CorrectArrangeOrder []int    `json:"correct_arrange_order"`
	CorrectFillAnswers  []string `json:"correct_fill_answers"`
}

// ── Quiz ──

type CreateQuizRequest struct {
	Title            string `json:"title" validate:"required,min=2,max=200"`
	TimeLimitSeconds int    `json:"time_limit_seconds" validate:"min=0"`
	PassScorePercent int    `json:"pass_score_percent" validate:"min=0,max=100"`
}

type QuestionOptionInput struct {
	OptionText string `json:"option_text" validate:"required"`
	IsCorrect  bool   `json:"is_correct"`
}

type QuestionArrangeItemInput struct {
	ItemText     string `json:"item_text" validate:"required"`
	CorrectOrder int    `json:"correct_order" validate:"min=1"`
}

type CreateQuestionRequest struct {
	QuestionType  string                     `json:"question_type" validate:"required,oneof=single_choice multi_choice arrange fill_blank"`
	QuestionText  string                     `json:"question_text" validate:"required"`
	Points        int                        `json:"points" validate:"min=1"`
	FillBlankHint *string                    `json:"fill_blank_hint"`
	Options       []QuestionOptionInput      `json:"options"`
	ArrangeItems  []QuestionArrangeItemInput `json:"arrange_items"`
	FillAnswers   []string                   `json:"fill_answers"`
}

type NextQuestionRequest struct {
	FetchedQuestionIDs []string `json:"fetched_question_ids"`
}

type SubmitQuizAnswerInput struct {
	QuestionID        string   `json:"question_id" validate:"required,uuid"`
	SelectedOptionIDs []string `json:"selected_option_ids"`
	ArrangeOrder      []int    `json:"arrange_order"`
	FillText          *string  `json:"fill_text"`
	IsSkipped         bool     `json:"is_skipped"`
}

type SubmitQuizRequest struct {
	Answers []SubmitQuizAnswerInput `json:"answers" validate:"required,min=1,dive"`
}

// ── Quiz Response ──

type QuestionForAttempt struct {
	ID            string                  `json:"id"`
	QuestionType  string                  `json:"question_type"`
	QuestionText  string                  `json:"question_text"`
	Points        int                     `json:"points"`
	Options       []QuizOptionPublic      `json:"options"`
	ArrangeItems  []QuizArrangeItemPublic `json:"arrange_items"`
	FillBlankHint *string                 `json:"fill_blank_hint"`
}

// Public option — no is_correct field exposed during quiz
type QuizOptionPublic struct {
	ID         string `json:"id"`
	OptionText string `json:"option_text"`
}

type QuizArrangeItemPublic struct {
	ID       string `json:"id"`
	ItemText string `json:"item_text"`
}

type NextQuestionResponse struct {
	Question           *QuestionForAttempt `json:"question"`
	RemainingQuestions int                 `json:"remaining_questions"`
}

type QuizResultItem struct {
	QuestionID          string   `json:"question_id"`
	IsCorrect           bool     `json:"is_correct"`
	CorrectOptionIDs    []string `json:"correct_option_ids"`
	CorrectArrangeOrder []int    `json:"correct_arrange_order"`
	CorrectFillAnswers  []string `json:"correct_fill_answers"`
}

type SubmitQuizResponse struct {
	AttemptID      string           `json:"attempt_id"`
	TotalScore     float64          `json:"total_score"`
	CorrectCount   int              `json:"correct_count"`
	IncorrectCount int              `json:"incorrect_count"`
	SkippedCount   int              `json:"skipped_count"`
	Passed         bool             `json:"passed"`
	Results        []QuizResultItem `json:"results"`
}
