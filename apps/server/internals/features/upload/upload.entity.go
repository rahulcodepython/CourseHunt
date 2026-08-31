package upload

type SignedURLResponse struct {
	URL         string `json:"url"`
	DownloadURL string `json:"downloadUrl"`
	HTMLURL     string `json:"htmlUrl"`
}
