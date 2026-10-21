package lessons

import (
	"context"
	"time"
)

type LessonFileCleanup struct {
	OldPreviewVideoURL *string
	OldVideoURL        *string
}

type LessonVideoContentCleanup struct {
	OldVideoURL *string
}

type LessonDeleteCleanup struct {
	OldPreviewVideoURL *string
	VideoURL           *string
	ResourceURLs       []string
}

// signVideoContent generates a short-lived presigned streaming URL for video lesson content.
func (a *App) signVideoContent(ctx context.Context, res *AggregatedLessonContentResponse) *AggregatedLessonContentResponse {
	if res == nil || res.VideoContent == nil || res.VideoContent.VideoURL == "" || a.Storage == nil {
		return res
	}
	cloned := *res
	videoCopy := *res.VideoContent
	if signedURL, signErr := a.Storage.GeneratePresignedStreamingURL(ctx, videoCopy.VideoURL, 15*time.Minute); signErr == nil && signedURL != "" {
		videoCopy.VideoURL = signedURL
	}
	cloned.VideoContent = &videoCopy
	return &cloned
}

// signResources swaps each private resource URL for a short-lived presigned
// download URL. Public and external URLs pass through unchanged.
func (a *App) signResources(ctx context.Context, resources []LessonResource) []LessonResource {
	if a.Storage == nil || len(resources) == 0 {
		return resources
	}
	signed := make([]LessonResource, len(resources))
	copy(signed, resources)
	for i := range signed {
		if u, err := a.Storage.GeneratePresignedDownloadURL(ctx, signed[i].FileURL, 15*time.Minute); err == nil && u != "" {
			signed[i].FileURL = u
		}
	}
	return signed
}
