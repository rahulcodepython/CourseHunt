package discussions

import (
	"errors"
)

var (
	ErrNotEnrolled        = errors.New("access denied: not enrolled in course")
	ErrLessonNotFound     = errors.New("lesson not found")
	ErrDiscussionNotFound = errors.New("discussion not found")
	ErrAccessDenied       = errors.New("access denied")
	ErrParentNotFound     = errors.New("parent discussion not found")
	ErrParentInvalid      = errors.New("parent discussion is in a different lesson")
	ErrMissingTarget      = errors.New("lesson id or parent id is required")
	ErrTargetNotFound     = errors.New("target lesson or discussion not found")
)
