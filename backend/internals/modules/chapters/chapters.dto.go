package chapters

// ── Chapters ──

type CreateChapterRequest struct {
	Title     string `json:"title" validate:"required,min=2,max=200"`
	ChapterNo int    `json:"chapter_no" validate:"required,min=1"`
}

type UpdateChapterRequest struct {
	Title     *string `json:"title" validate:"omitempty,min=2,max=200"`
	ChapterNo *int    `json:"chapter_no" validate:"omitempty,min=1"`
}
