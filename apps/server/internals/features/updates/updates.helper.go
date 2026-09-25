package updates

type updatesPayload struct {
	Total int            `json:"total"`
	Data  []CourseUpdate `json:"data"`
}

type updatesCacheData struct {
	Data  []CourseUpdate `json:"data"`
	Total int            `json:"total"`
}
