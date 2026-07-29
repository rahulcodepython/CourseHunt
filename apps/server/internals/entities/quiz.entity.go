package entities

type QuizMetadata struct {
	ID               string `json:"id" db:"id"`
	LessonID         string `json:"lesson_id" db:"lesson_id"`
	Title            string `json:"title" db:"title"`
	TimeLimitSeconds int    `json:"time_limit_seconds" db:"time_limit_seconds"`
	TotalQuestions   int    `json:"total_questions" db:"total_questions"`
	PassScorePercent int    `json:"pass_score_percent" db:"pass_score_percent"`
}

type QuizQuestion struct {
	ID            string  `json:"id" db:"id"`
	QuizID        string  `json:"quiz_id" db:"quiz_id"`
	QuestionType  string  `json:"question_type" db:"question_type"`
	QuestionText  string  `json:"question_text" db:"question_text"`
	Points        int     `json:"points" db:"points"`
	FillBlankHint *string `json:"fill_blank_hint" db:"fill_blank_hint"`
}

type QuizOption struct {
	ID         string `json:"id" db:"id"`
	QuestionID string `json:"question_id" db:"question_id"`
	OptionText string `json:"option_text" db:"option_text"`
	IsCorrect  bool   `json:"is_correct,omitempty" db:"is_correct"`
}

type QuizArrangeItem struct {
	ID           string `json:"id" db:"id"`
	QuestionID   string `json:"question_id" db:"question_id"`
	ItemText     string `json:"item_text" db:"item_text"`
	CorrectOrder int    `json:"correct_order" db:"correct_order"`
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

type AttemptAnswerToSave struct {
	QuestionID        string
	SelectedOptionIDs []string
	ArrangeOrder      []int
	FillText          *string
	IsSkipped         bool
	IsCorrect         bool
}

type QuizEvaluationData struct {
	PassScorePercent int
	Questions        map[string]QuestionValidation
}
