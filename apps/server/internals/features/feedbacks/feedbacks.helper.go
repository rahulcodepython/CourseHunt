package feedbacks

type feedbackListCacheData struct {
	Data  []Feedback `json:"data"`
	Total int        `json:"total"`
}
