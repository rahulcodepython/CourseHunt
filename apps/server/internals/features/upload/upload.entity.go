package upload

// Visibility selects the bucket an upload lands in. Public objects (course
// images, preview videos, avatars) are served straight from
// MINIO_PUBLIC_BASE_URL; private objects (lesson videos, resources) are only
// reachable through short-lived presigned URLs.
const (
	VisibilityPublic  = "public"
	VisibilityPrivate = "private"
)

type SignedURLResponse struct {
	URL         string `json:"url"`
	DownloadURL string `json:"downloadUrl"`
	HTMLURL     string `json:"htmlUrl"`
}
