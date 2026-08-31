package quiz

import "time"

type QuizMetadata struct {
	ID               string    `json:"id" db:"id"`
	LessonID         string    `json:"lesson_id" db:"lesson_id"`
	Title            string    `json:"title" db:"title"`
	TimeLimitSeconds int       `json:"time_limit_seconds" db:"time_limit_seconds"`
	TotalQuestions   int       `json:"total_questions" db:"total_questions"`
	PassScorePercent int       `json:"pass_score_percent" db:"pass_score_percent"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

type QuizQuestion struct {
	ID            string    `json:"id" db:"id"`
	QuizID        string    `json:"quiz_id" db:"quiz_id"`
	QuestionType  string    `json:"question_type" db:"question_type"`
	QuestionText  string    `json:"question_text" db:"question_text"`
	Points        int       `json:"points" db:"points"`
	FillBlankHint *string   `json:"fill_blank_hint" db:"fill_blank_hint"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

type QuizQuestionDetail struct {
	ID            string                `json:"id" db:"id"`
	QuizID        string                `json:"quiz_id" db:"quiz_id"`
	QuestionType  string                `json:"question_type" db:"question_type"`
	QuestionText  string                `json:"question_text" db:"question_text"`
	Points        int                   `json:"points" db:"points"`
	FillBlankHint *string               `json:"fill_blank_hint" db:"fill_blank_hint"`
	CreatedAt     time.Time             `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time             `json:"updated_at" db:"updated_at"`
	Options       []QuizOption          `json:"options"`
	ArrangeItems  []QuizArrangeItem     `json:"arrange_items"`
	FillAnswers   []QuizFillBlankAnswer `json:"fill_answers"`
}

type QuizOption struct {
	ID         string    `json:"id" db:"id"`
	QuestionID string    `json:"question_id" db:"question_id"`
	OptionText string    `json:"option_text" db:"option_text"`
	IsCorrect  bool      `json:"is_correct,omitempty" db:"is_correct"`
	SortOrder  int       `json:"sort_order" db:"sort_order"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type QuizArrangeItem struct {
	ID           string    `json:"id" db:"id"`
	QuestionID   string    `json:"question_id" db:"question_id"`
	ItemText     string    `json:"item_text" db:"item_text"`
	CorrectOrder int       `json:"correct_order" db:"correct_order"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type QuizFillBlankAnswer struct {
	ID         string    `json:"id" db:"id"`
	QuestionID string    `json:"question_id" db:"question_id"`
	Answer     string    `json:"answer" db:"answer"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type QuestionValidation struct {
	ID                  string   `json:"id"`
	QuestionType        string   `json:"question_type"`
	Points              int      `json:"points"`
	CorrectOptionIDs    []string `json:"correct_option_ids"`
	CorrectArrangeOrder []int    `json:"correct_arrange_order"`
	CorrectFillAnswers  []string `json:"correct_fill_answers"`
}

// ── Quiz Question Creation & Submission ──

type CreateQuizRequest struct {
	Title            string `json:"title" validate:"required,min=2,max=200"`
	TimeLimitSeconds int    `json:"time_limit_seconds" validate:"min=0"`
	PassScorePercent int    `json:"pass_score_percent" validate:"min=0,max=100"`
}

type QuestionOptionInput struct {
	OptionText string `json:"option_text" validate:"required,max=500"`
	IsCorrect  bool   `json:"is_correct"`
	SortOrder  int    `json:"sort_order"`
}

type QuestionArrangeItemInput struct {
	ItemText     string `json:"item_text" validate:"required,max=500"`
	CorrectOrder int    `json:"correct_order" validate:"min=1"`
}

type CreateQuestionRequest struct {
	QuestionType  string                     `json:"question_type" validate:"required,oneof=single_choice multi_choice arrange fill_blank"`
	QuestionText  string                     `json:"question_text" validate:"required,max=2000"`
	Points        int                        `json:"points" validate:"min=1"`
	FillBlankHint *string                    `json:"fill_blank_hint" validate:"omitempty,max=500"`
	Options       []QuestionOptionInput      `json:"options" validate:"omitempty,max=20,dive"`
	ArrangeItems  []QuestionArrangeItemInput `json:"arrange_items" validate:"omitempty,max=20,dive"`
	FillAnswers   []string                   `json:"fill_answers" validate:"omitempty,max=20,dive,max=500"`
}

type NextQuestionRequest struct {
	FetchedQuestionIDs []string `json:"fetched_question_ids" validate:"omitempty,max=500,dive,uuid"`
}

type SubmitSingleAnswerInput struct {
	QuestionID       string `json:"question_id" validate:"required,uuid"`
	SelectedOptionID string `json:"selected_option_id" validate:"required,uuid"`
	IsSkipped        bool   `json:"is_skipped"`
}

type SubmitMultiAnswerInput struct {
	QuestionID        string   `json:"question_id" validate:"required,uuid"`
	SelectedOptionIDs []string `json:"selected_option_ids" validate:"required,dive,uuid"`
	IsSkipped         bool     `json:"is_skipped"`
}

type ArrangeSubmittedItem struct {
	ItemID string `json:"item_id" validate:"required,uuid"`
	Order  int    `json:"order" validate:"required"`
}

type SubmitArrangeAnswerInput struct {
	QuestionID string                 `json:"question_id" validate:"required,uuid"`
	Items      []ArrangeSubmittedItem `json:"items" validate:"required,dive"`
	IsSkipped  bool                   `json:"is_skipped"`
}

type SubmitFillAnswerInput struct {
	QuestionID string `json:"question_id" validate:"required,uuid"`
	FillText   string `json:"fill_text" validate:"required,max=500"`
	IsSkipped  bool   `json:"is_skipped"`
}

type SubmitQuizRequest struct {
	SingleAnswers  []SubmitSingleAnswerInput  `json:"single_answers" validate:"omitempty,max=100,dive"`
	MultiAnswers   []SubmitMultiAnswerInput   `json:"multi_answers" validate:"omitempty,max=100,dive"`
	ArrangeAnswers []SubmitArrangeAnswerInput `json:"arrange_answers" validate:"omitempty,max=100,dive"`
	FillAnswers    []SubmitFillAnswerInput    `json:"fill_answers" validate:"omitempty,max=100,dive"`
}

// ── Quiz Question Response Models ──

type QuestionForAttempt struct {
	ID            string                  `json:"id"`
	QuestionType  string                  `json:"question_type"`
	QuestionText  string                  `json:"question_text"`
	Points        int                     `json:"points"`
	Options       []QuizOptionPublic      `json:"options"`
	ArrangeItems  []QuizArrangeItemPublic `json:"arrange_items"`
	FillBlankHint *string                 `json:"fill_blank_hint"`
}

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

type QuizAttemptSingleAnswer struct {
	ID               string    `json:"id" db:"id"`
	AttemptID        string    `json:"attempt_id" db:"attempt_id"`
	QuestionID       string    `json:"question_id" db:"question_id"`
	SelectedOptionID string    `json:"selected_option_id" db:"selected_option_id"`
	IsCorrect        bool      `json:"is_correct" db:"is_correct"`
	IsSkipped        bool      `json:"is_skipped" db:"is_skipped"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

type QuizAttemptMultiAnswer struct {
	ID         string    `json:"id" db:"id"`
	AttemptID  string    `json:"attempt_id" db:"attempt_id"`
	QuestionID string    `json:"question_id" db:"question_id"`
	IsCorrect  bool      `json:"is_correct" db:"is_correct"`
	IsSkipped  bool      `json:"is_skipped" db:"is_skipped"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type QuizAttemptMultiAnswerOption struct {
	MultiAnswerID    string `json:"multi_answer_id" db:"multi_answer_id"`
	SelectedOptionID string `json:"selected_option_id" db:"selected_option_id"`
}

type QuizAttemptArrangeAnswer struct {
	ID             string    `json:"id" db:"id"`
	AttemptID      string    `json:"attempt_id" db:"attempt_id"`
	QuestionID     string    `json:"question_id" db:"question_id"`
	ArrangeItemID  string    `json:"arrange_item_id" db:"arrange_item_id"`
	SubmittedOrder int       `json:"submitted_order" db:"submitted_order"`
	IsCorrect      bool      `json:"is_correct" db:"is_correct"`
	IsSkipped      bool      `json:"is_skipped" db:"is_skipped"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

type QuizAttemptFillAnswer struct {
	ID         string    `json:"id" db:"id"`
	AttemptID  string    `json:"attempt_id" db:"attempt_id"`
	QuestionID string    `json:"question_id" db:"question_id"`
	FillText   string    `json:"fill_text" db:"fill_text"`
	IsCorrect  bool      `json:"is_correct" db:"is_correct"`
	IsSkipped  bool      `json:"is_skipped" db:"is_skipped"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type QuizEvaluationData struct {
	PassScorePercent int
	Questions        map[string]QuestionValidation
}

// ── Quiz Attempts (history & breakdown) ──

type QuizAttemptSummary struct {
	ID             string     `json:"id" db:"id"`
	StartedAt      time.Time  `json:"started_at" db:"started_at"`
	SubmittedAt    *time.Time `json:"submitted_at" db:"submitted_at"`
	TotalScore     float64    `json:"total_score" db:"total_score"`
	Passed         bool       `json:"passed" db:"passed"`
	CorrectCount   int        `json:"correct_count" db:"correct_count"`
	IncorrectCount int        `json:"incorrect_count" db:"incorrect_count"`
	SkippedCount   int        `json:"skipped_count" db:"skipped_count"`
}

type QuizAttemptOptionBreakdown struct {
	OptionID   string `json:"option_id"`
	OptionText string `json:"option_text"`
	IsCorrect  bool   `json:"is_correct"`
	IsSelected bool   `json:"is_selected"`
}

type QuizAttemptArrangeBreakdown struct {
	ItemID         string `json:"item_id"`
	ItemText       string `json:"item_text"`
	CorrectOrder   int    `json:"correct_order"`
	SubmittedOrder int    `json:"submitted_order"`
}

type QuizAttemptQuestionBreakdown struct {
	QuestionID    string                        `json:"question_id" db:"question_id"`
	QuestionType  string                        `json:"question_type" db:"question_type"`
	QuestionText  string                        `json:"question_text" db:"question_text"`
	Points        int                           `json:"points" db:"points"`
	IsCorrect     bool                          `json:"is_correct" db:"is_correct"`
	IsSkipped     bool                          `json:"is_skipped" db:"is_skipped"`
	YourAnswer    string                        `json:"your_answer" db:"your_answer"`
	CorrectAnswer string                        `json:"correct_answer" db:"correct_answer"`
	Options       []QuizAttemptOptionBreakdown  `json:"options"`
	ArrangeItems  []QuizAttemptArrangeBreakdown `json:"arrange_items"`
	FillAnswers   []string                      `json:"fill_answers"`
}

type QuizAttemptDetail struct {
	AttemptID  string                         `json:"attempt_id"`
	QuizTitle  string                         `json:"quiz_title"`
	TotalScore float64                        `json:"total_score"`
	Passed     bool                           `json:"passed"`
	Questions  []QuizAttemptQuestionBreakdown `json:"questions"`
}
