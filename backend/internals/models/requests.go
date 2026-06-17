package models

// ── Auth / Profile ─────────────────────────────────────────────────────────────

type UpdateProfileRequest struct {
	Headline *string `json:"headline"`
	Bio      *string `json:"bio"`
	Website  *string `json:"website"`
}

// ── Categories ────────────────────────────────────────────────────────────────

type CreateCategoryRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}

type CreateSubcategoryRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}

// ── Courses ───────────────────────────────────────────────────────────────────

type CreateCourseRequest struct {
	Title            string  `json:"title" validate:"required,min=3,max=200"`
	ShortDescription *string `json:"short_description"`
	CategoryID       *string `json:"category_id"`
	SubcategoryID    *string `json:"subcategory_id"`
	Language         string  `json:"language"`
	Level            string  `json:"level" validate:"omitempty,oneof=beginner intermediate advanced all"`
	Status           string  `json:"status" validate:"omitempty,oneof=draft published archived"`
}

type UpdateCourseRequest struct {
	Title            *string  `json:"title" validate:"omitempty,min=3,max=200"`
	ShortDescription *string  `json:"short_description"`
	LongDescription  *string  `json:"long_description"`
	ImageURL         *string  `json:"image_url"`
	PreviewVideoURL  *string  `json:"preview_video_url"`
	Language         *string  `json:"language"`
	Level            *string  `json:"level" validate:"omitempty,oneof=beginner intermediate advanced all"`
	ActualPrice      *float64 `json:"actual_price" validate:"omitempty,min=0"`
	FinalPrice       *float64 `json:"final_price" validate:"omitempty,min=0"`
	Benefits         []string `json:"benefits"`
	Requirements     []string `json:"requirements"`
	CategoryID       *string  `json:"category_id"`
	SubcategoryID    *string  `json:"subcategory_id"`
	CouponAllowed    *bool    `json:"coupon_allowed"`
	Status           *string  `json:"status" validate:"omitempty,oneof=draft published archived"`
}

// ── Chapters ──────────────────────────────────────────────────────────────────

type CreateChapterRequest struct {
	Title     string `json:"title" validate:"required,min=2,max=200"`
	ChapterNo int    `json:"chapter_no" validate:"required,min=1"`
}

type UpdateChapterRequest struct {
	Title     *string `json:"title" validate:"omitempty,min=2,max=200"`
	ChapterNo *int    `json:"chapter_no" validate:"omitempty,min=1"`
}

// ── Lessons ───────────────────────────────────────────────────────────────────

type CreateLessonRequest struct {
	Title            string  `json:"title" validate:"required,min=2,max=200"`
	LessonNo         int     `json:"lesson_no" validate:"required,min=1"`
	LessonType       string  `json:"lesson_type" validate:"required,oneof=video document quiz"`
	ShortDescription *string `json:"short_description"`
	PreviewVideoURL  *string `json:"preview_video_url"`
	DurationSeconds  int     `json:"duration_seconds" validate:"min=0"`
}

type UpdateLessonRequest struct {
	Title            *string `json:"title" validate:"omitempty,min=2,max=200"`
	LessonNo         *int    `json:"lesson_no" validate:"omitempty,min=1"`
	ShortDescription *string `json:"short_description"`
	PreviewVideoURL  *string `json:"preview_video_url"`
	DurationSeconds  *int    `json:"duration_seconds" validate:"omitempty,min=0"`
}

type UpsertVideoContentRequest struct {
	VideoURL       string  `json:"video_url" validate:"required,url"`
	WrittenContent *string `json:"written_content"`
}

type UpsertDocumentContentRequest struct {
	Content string `json:"content" validate:"required"`
}

type AddResourceRequest struct {
	Title    string  `json:"title" validate:"required,min=1,max=200"`
	FileURL  string  `json:"file_url" validate:"required,url"`
	FileType *string `json:"file_type"`
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

type CreateQuizRequest struct {
	Title             string `json:"title" validate:"required,min=2,max=200"`
	TimeLimitSeconds  int    `json:"time_limit_seconds" validate:"min=0"`
	PassScorePercent  int    `json:"pass_score_percent" validate:"min=0,max=100"`
}

type CreateQuestionRequest struct {
	QuestionType  string   `json:"question_type" validate:"required,oneof=single_choice multi_choice arrange fill_blank"`
	QuestionText  string   `json:"question_text" validate:"required"`
	Points        int      `json:"points" validate:"min=1"`
	FillBlankHint *string  `json:"fill_blank_hint"`
	Options       []struct {
		OptionText string `json:"option_text" validate:"required"`
		IsCorrect  bool   `json:"is_correct"`
	} `json:"options"`
	ArrangeItems []struct {
		ItemText     string `json:"item_text" validate:"required"`
		CorrectOrder int    `json:"correct_order" validate:"min=1"`
	} `json:"arrange_items"`
	FillAnswers []string `json:"fill_answers"`
}

type StartQuizAttemptRequest struct {
	// No body needed — quizID comes from URL param
}

type NextQuestionRequest struct {
	AttemptID        string   `json:"attempt_id" validate:"required,uuid"`
	FetchedQuestionIDs []string `json:"fetched_question_ids" validate:"required"`
}

type SubmitQuizRequest struct {
	AttemptID string `json:"attempt_id" validate:"required,uuid"`
	Answers   []struct {
		QuestionID        string   `json:"question_id" validate:"required,uuid"`
		SelectedOptionIDs []string `json:"selected_option_ids"`
		ArrangeOrder      []int    `json:"arrange_order"`
		FillText          *string  `json:"fill_text"`
		IsSkipped         bool     `json:"is_skipped"`
	} `json:"answers" validate:"required,min=1,dive"`
}

// ── Discussions ───────────────────────────────────────────────────────────────

type CreateDiscussionRequest struct {
	Content  string  `json:"content" validate:"required,min=1,max=5000"`
	ParentID *string `json:"parent_id" validate:"omitempty,uuid"`
}

// ── Notes ─────────────────────────────────────────────────────────────────────

type UpsertNoteRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

// ── Updates ───────────────────────────────────────────────────────────────────

type CreateUpdateRequest struct {
	Message  string  `json:"message" validate:"required,min=1,max=2000"`
	CourseID *string `json:"course_id" validate:"omitempty,uuid"`
}

type UpdateUpdateRequest struct {
	Message string `json:"message" validate:"required,min=1,max=2000"`
}

// ── Feedbacks ─────────────────────────────────────────────────────────────────

type CreateFeedbackRequest struct {
	Rating  int     `json:"rating" validate:"required,min=1,max=5"`
	Content *string `json:"content"`
}

// ── Coupons ───────────────────────────────────────────────────────────────────

type CreateCouponRequest struct {
	Code            string  `json:"code" validate:"required,min=3,max=50"`
	CourseID        *string `json:"course_id" validate:"omitempty,uuid"`
	DiscountPercent float64 `json:"discount_percent" validate:"required,min=1,max=100"`
	MaxUsage        int     `json:"max_usage" validate:"required,min=1"`
	ExpiresAt       string  `json:"expires_at" validate:"required"`
	IsActive        bool    `json:"is_active"`
}

type UpdateCouponRequest struct {
	DiscountPercent *float64 `json:"discount_percent" validate:"omitempty,min=1,max=100"`
	MaxUsage        *int     `json:"max_usage" validate:"omitempty,min=1"`
	ExpiresAt       *string  `json:"expires_at"`
	IsActive        *bool    `json:"is_active"`
}

// ── Transactions ──────────────────────────────────────────────────────────────

type InitiateTransactionRequest struct {
	CourseID   string  `json:"course_id" validate:"required,uuid"`
	CouponCode *string `json:"coupon_code"`
}

type ManualEnrollRequest struct {
	UserID string `json:"user_id" validate:"required"`
}

// ── Users ─────────────────────────────────────────────────────────────────────

type AssignRoleRequest struct {
	RoleID int `json:"role_id" validate:"required,min=1"`
}
