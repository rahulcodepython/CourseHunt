package models

import "time"

// ── Course Responses ──────────────────────────────────────────────────────────

type InstructorInfo struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Image    *string `json:"image"`
	Headline *string `json:"headline,omitempty"`
}

type CategoryInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type CourseCardResponse struct {
	ID               string         `json:"id"`
	Slug             string         `json:"slug"`
	Title            string         `json:"title"`
	ShortDescription *string        `json:"short_description"`
	ImageURL         *string        `json:"image_url"`
	ActualPrice      float64        `json:"actual_price"`
	FinalPrice       float64        `json:"final_price"`
	Benefits         []string       `json:"benefits"`
	Level            string         `json:"level"`
	RatingAvg        float64        `json:"rating_avg"`
	FeedbackCount    int            `json:"feedback_count"`
	Instructor       InstructorInfo `json:"instructor"`
}

type LessonCardResponse struct {
	ID               string  `json:"id"`
	LessonNo         int     `json:"lesson_no"`
	Title            string  `json:"title"`
	LessonType       string  `json:"lesson_type"`
	ShortDescription *string `json:"short_description"`
	PreviewVideoURL  *string `json:"preview_video_url"`
	DurationSeconds  int     `json:"duration_seconds"`
}

type ChapterCardResponse struct {
	ID                   string               `json:"id"`
	ChapterNo            int                  `json:"chapter_no"`
	Title                string               `json:"title"`
	TotalLectures        int                  `json:"total_lectures"`
	TotalDurationSeconds int                  `json:"total_duration_seconds"`
	Lessons              []LessonCardResponse `json:"lessons"`
}

type CourseLandingResponse struct {
	ID                   string                `json:"id"`
	Slug                 string                `json:"slug"`
	Title                string                `json:"title"`
	ShortDescription     *string               `json:"short_description"`
	LongDescription      *string               `json:"long_description"`
	ImageURL             *string               `json:"image_url"`
	PreviewVideoURL      *string               `json:"preview_video_url"`
	Language             string                `json:"language"`
	Level                string                `json:"level"`
	ActualPrice          float64               `json:"actual_price"`
	FinalPrice           float64               `json:"final_price"`
	Benefits             []string              `json:"benefits"`
	Requirements         []string              `json:"requirements"`
	Category             *CategoryInfo         `json:"category"`
	Subcategory          *CategoryInfo         `json:"subcategory"`
	Instructor           InstructorInfo        `json:"instructor"`
	TotalLectures        int                   `json:"total_lectures"`
	TotalDurationSeconds int                   `json:"total_duration_seconds"`
	RatingAvg            float64               `json:"rating_avg"`
	FeedbackCount        int                   `json:"feedback_count"`
	IsEnrolled           bool                  `json:"is_enrolled"`
	Chapters             []ChapterCardResponse `json:"chapters"`
}

type EnrolledCourseResponse struct {
	ID                   string         `json:"id"`
	Slug                 string         `json:"slug"`
	Title                string         `json:"title"`
	ImageURL             *string        `json:"image_url"`
	Instructor           InstructorInfo `json:"instructor"`
	CompletionPercent    float64        `json:"completion_percent"`
	LastAccessedLessonID *string        `json:"last_accessed_lesson_id"`
}

// ── Study Responses ───────────────────────────────────────────────────────────

type StudyLessonItem struct {
	ID              string `json:"id"`
	LessonNo        int    `json:"lesson_no"`
	Title           string `json:"title"`
	LessonType      string `json:"lesson_type"`
	DurationSeconds int    `json:"duration_seconds"`
	Completed       bool   `json:"completed"`
}

type StudyChapterItem struct {
	ID                   string            `json:"id"`
	ChapterNo            int               `json:"chapter_no"`
	Title                string            `json:"title"`
	TotalLectures        int               `json:"total_lectures"`
	TotalDurationSeconds int               `json:"total_duration_seconds"`
	Progress             struct {
		LessonsCompleted int  `json:"lessons_completed"`
		Completed        bool `json:"completed"`
	} `json:"progress"`
	Lessons []StudyLessonItem `json:"lessons"`
}

type CourseStudyResponse struct {
	Course struct {
		ID       string  `json:"id"`
		Title    string  `json:"title"`
		ImageURL *string `json:"image_url"`
	} `json:"course"`
	Enrollment struct {
		CompletionPercent float64 `json:"completion_percent"`
		Completed         bool    `json:"completed"`
	} `json:"enrollment"`
	Chapters []StudyChapterItem `json:"chapters"`
}

// ── Lesson Content Responses ──────────────────────────────────────────────────

type LessonContentResponse struct {
	Lesson struct {
		ID         string `json:"id"`
		Title      string `json:"title"`
		LessonType string `json:"lesson_type"`
		LessonNo   int    `json:"lesson_no"`
		ChapterID  string `json:"chapter_id"`
	} `json:"lesson"`
	Content struct {
		// video
		VideoURL       *string `json:"video_url,omitempty"`
		WrittenContent *string `json:"written_content,omitempty"`
		// document
		DocumentContent *string `json:"content,omitempty"`
		// quiz
		QuizMetadata *QuizMetadata `json:"quiz_metadata,omitempty"`
	} `json:"content"`
	Resources []LessonResource `json:"resources"`
	UserNote  struct {
		Content *string `json:"content"`
	} `json:"user_note"`
	Completed bool `json:"completed"`
}

// ── Quiz Response ─────────────────────────────────────────────────────────────

type QuestionForAttempt struct {
	ID           string            `json:"id"`
	QuestionType string            `json:"question_type"`
	QuestionText string            `json:"question_text"`
	Points       int               `json:"points"`
	Options      []QuizOptionPublic `json:"options"`
	ArrangeItems []QuizArrangeItemPublic `json:"arrange_items"`
	FillBlankHint *string          `json:"fill_blank_hint"`
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
	AttemptID          string              `json:"attempt_id"`
	Question           *QuestionForAttempt `json:"question"`
	RemainingQuestions int                 `json:"remaining_questions"`
	TimeRemainingSeconds int               `json:"time_remaining_seconds"`
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

// ── Transaction Response ──────────────────────────────────────────────────────

type InitiateTransactionResponse struct {
	TransactionID  string  `json:"transaction_id"`
	RazorpayOrderID string `json:"razorpay_order_id"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	RazorpayKey    string  `json:"razorpay_key"`
}

// ── Coupon Check Response ─────────────────────────────────────────────────────

type CouponCheckResponse struct {
	Valid           bool    `json:"valid"`
	DiscountPercent float64 `json:"discount_percent"`
	Reason          *string `json:"reason"`
}

// ── Discussion Responses ──────────────────────────────────────────────────────

type DiscussionUserInfo struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Image *string `json:"image"`
}

type DiscussionResponse struct {
	ID         string             `json:"id"`
	Content    string             `json:"content"`
	Depth      int                `json:"depth"`
	ReplyCount int                `json:"reply_count"`
	CreatedAt  time.Time          `json:"created_at"`
	User       DiscussionUserInfo `json:"user"`
}

// ── Update Feed Response ──────────────────────────────────────────────────────

type UpdateFeedItem struct {
	ID          string    `json:"id"`
	Message     string    `json:"message"`
	CourseID    *string   `json:"course_id"`
	CourseTitle *string   `json:"course_title"`
	CreatedAt   time.Time `json:"created_at"`
}

type UpdateFeedResponse struct {
	Unseen []UpdateFeedItem   `json:"unseen"`
	Older  PaginatedResponse  `json:"older"`
}

// ── Note Response ─────────────────────────────────────────────────────────────

type NoteResponse struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ── User List Response ────────────────────────────────────────────────────────

type UserListItem struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Image         *string   `json:"image"`
	EmailVerified bool      `json:"emailVerified"`
	Banned        bool      `json:"banned"`
	CreatedAt     time.Time `json:"createdAt"`
	Roles         []Role    `json:"roles"`
}

// ── Course created/updated response ──────────────────────────────────────────

type CourseCreatedResponse struct {
	ID        string    `json:"id"`
	Slug      string    `json:"slug"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// ── Feedback Response ─────────────────────────────────────────────────────────

type FeedbackResponse struct {
	ID        string    `json:"id"`
	CourseID  string    `json:"course_id"`
	Rating    int       `json:"rating"`
	Content   *string   `json:"content"`
	IsPinned  bool      `json:"is_pinned"`
	CreatedAt time.Time `json:"created_at"`
	User      struct {
		ID    string  `json:"id"`
		Name  string  `json:"name"`
		Image *string `json:"image"`
	} `json:"user"`
}

// ── Certificate Response ──────────────────────────────────────────────────────

type CertificateResponse struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	CourseID    string    `json:"course_id"`
	CourseTitle string    `json:"course_title"`
	IssuedAt    time.Time `json:"issued_at"`
}

// ── Wishlist / Cart Response ──────────────────────────────────────────────────

type WishlistItemResponse struct {
	ID       string             `json:"id"`
	Course   CourseCardResponse `json:"course"`
	AddedAt  time.Time          `json:"added_at"`
}

type CartItemResponse struct {
	ID      string             `json:"id"`
	Course  CourseCardResponse `json:"course"`
	AddedAt time.Time          `json:"added_at"`
}
