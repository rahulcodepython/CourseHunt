package generic

import "errors"

// Auth errors
var (
	ErrAuthInvalidCredentials     = errors.New("login failed: invalid email or password")
	ErrAuthUserBanned             = errors.New("account is banned")
	ErrAuthUserNotFound           = errors.New("user not found, please register")
	ErrAuthNoEmailInToken         = errors.New("no email provided in token")
	ErrAuthSessionExpired         = errors.New("session expired")
	ErrAuthRoleNotFound           = errors.New("role not found")
	ErrAuthFailedToCreateUser     = errors.New("failed to create user")
	ErrAuthInvalidCurrentPassword = errors.New("invalid current password")
	ErrAuthFailedToChangePassword = errors.New("failed to change password")
)

// Courses errors
var (
	ErrCoursesCourseNotFound = errors.New("course not found")
	ErrCoursesNotEnrolled    = errors.New("not enrolled in this course")
	ErrCoursesAccessDenied   = errors.New("access denied")
)

// Users errors
var (
	ErrUsersNotVerified = errors.New("access denied: email is not verified")
)

// Enrollments errors
var (
	ErrEnrollmentsAccessDenied = errors.New("access denied")
)

// Lessons errors
var (
	ErrLessonsNotEnrolled      = errors.New("access denied: not enrolled in course")
	ErrLessonsLessonNotFound   = errors.New("lesson not found")
	ErrLessonsChapterNotFound  = errors.New("chapter not found")
	ErrLessonsResourceNotFound = errors.New("resource not found")
	ErrLessonsAccessDenied     = errors.New("access denied")
)

// Chapters errors
var (
	ErrChaptersCourseNotFound  = errors.New("course not found")
	ErrChaptersUnauthorized    = errors.New("access denied: you are not the tutor of this course")
	ErrChaptersChapterNotFound = errors.New("chapter not found")
)

// Discussions errors
var (
	ErrDiscussionsNotEnrolled        = errors.New("access denied: not enrolled in course")
	ErrDiscussionsLessonNotFound     = errors.New("lesson not found")
	ErrDiscussionsDiscussionNotFound = errors.New("discussion not found")
	ErrDiscussionsAccessDenied       = errors.New("access denied")
	ErrDiscussionsParentNotFound     = errors.New("parent discussion not found")
	ErrDiscussionsParentInvalid      = errors.New("parent discussion is in a different lesson")
	ErrDiscussionsMissingTarget      = errors.New("lesson id or parent id is required")
	ErrDiscussionsTargetNotFound     = errors.New("target lesson or discussion not found")
)

// Quiz errors
var (
	ErrQuizNotEnrolled      = errors.New("access denied: not enrolled in course")
	ErrQuizAccessDenied     = errors.New("access denied")
	ErrQuizLessonNotFound   = errors.New("lesson not found")
	ErrQuizNotFound         = errors.New("quiz not found")
	ErrQuizQuestionNotFound = errors.New("question not found")
)

// Coupons errors
var (
	ErrCouponNotFound        = errors.New("coupon not found")
	ErrCouponsUnauthorized   = errors.New("access denied: you are not the tutor of this course")
	ErrCouponsCourseNotFound = errors.New("associated course not found")
)

// Feedbacks errors
var (
	ErrFeedbacksNotEnrolled    = errors.New("access denied: not enrolled in course")
	ErrFeedbacksFeedbackNotFound = errors.New("feedback not found")
)

// Notes errors
var (
	ErrNotesNotEnrolled    = errors.New("access denied: not enrolled in course")
	ErrNotesLessonNotFound = errors.New("lesson not found")
	ErrNoteNotFound        = errors.New("note not found")
	ErrNotesAccessDenied   = errors.New("access denied")
)

// Certificate errors
var (
	ErrCertificateNotEnrolled     = errors.New("access denied: not enrolled in course")
	ErrCertificateNotCompleted    = errors.New("course not completed")
	ErrCertificateFailedToExecute = errors.New("failed to issue certificate")
)
