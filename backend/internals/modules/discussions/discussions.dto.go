package discussions

import (
	"coursehunt-backend/internals/models"
	"time"
)

// ── Discussions ──

type CreateDiscussionRequest struct {
	Content  string  `json:"content" validate:"required,min=1,max=5000"`
	ParentID *string `json:"parent_id" validate:"omitempty,uuid"`
}

type UpdateDiscussionRequest struct {
	Content string `json:"content" validate:"required,min=1,max=5000"`
}

// ── Discussion Responses ──

type DiscussionResponse struct {
	ID         string          `json:"id"`
	Content    string          `json:"content"`
	Depth      int             `json:"depth"`
	ReplyCount int             `json:"reply_count"`
	CreatedAt  time.Time       `json:"created_at"`
	User       models.UserInfo `json:"user"`
}
