package courses

// publicCoursesCacheData is a cache serialization envelope for public course listings.
type publicCoursesCacheData struct {
	Cards []CoursePublicResponse `json:"cards"`
	Total int                    `json:"total"`
}

// CourseFileCleanup carries the pre-update file URLs out of
// UpdateRepository so the service layer can tell Storage to delete
// any media files that were replaced by the update.
type CourseFileCleanup struct {
	OldImageURL        *string
	OldPreviewVideoURL *string
}
