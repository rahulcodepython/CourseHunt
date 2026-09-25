package categories

type CategoriesListPayload struct {
	Total int        `json:"total"`
	Data  []Category `json:"data"`
}

type categoryListCacheData struct {
	Cats  []Category `json:"cats"`
	Total int        `json:"total"`
}
