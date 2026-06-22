package enrollments

// ── Study Responses ──

type StudyLessonItem struct {
	ID              string `json:"id"`
	LessonNo        int    `json:"lesson_no"`
	Title           string `json:"title"`
	LessonType      string `json:"lesson_type"`
	DurationSeconds int    `json:"duration_seconds"`
	Completed       bool   `json:"completed"`
}

type StudyChapterItem struct {
	ID                   string `json:"id"`
	ChapterNo            int    `json:"chapter_no"`
	Title                string `json:"title"`
	TotalLectures        int    `json:"total_lectures"`
	TotalDurationSeconds int    `json:"total_duration_seconds"`
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
