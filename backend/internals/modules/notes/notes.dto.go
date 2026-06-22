package notes

import "time"

// ── Notes ──

type UpsertNoteRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

// ── Note Response ──

type NoteResponse struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	UpdatedAt time.Time `json:"updated_at"`
}
