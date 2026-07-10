package feedbacks

// ── Feedbacks ──

type CreateFeedbackRequest struct {
	Rating  int     `json:"rating" validate:"required,min=1,max=5"`
	Content *string `json:"content"`
}
