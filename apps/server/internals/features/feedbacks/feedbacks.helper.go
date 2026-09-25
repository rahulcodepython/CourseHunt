package feedbacks

type FeedbackListPayload struct {
	Total int        `json:"total"`
	Data  []Feedback `json:"data"`
}

type feedbackListCacheData struct {
	Data  []Feedback `json:"data"`
	Total int        `json:"total"`
}
