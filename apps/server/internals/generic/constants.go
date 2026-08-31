package generic

import "errors"

const (
	JWKSRedisCacheKey = "jwks_keys_cache"
)

// System Segments (stored in users.role column)
const (
	RoleAdmin = "admin"
	RoleTutor = "tutor"
	RoleUser  = "user"
)

// Course Statuses
const (
	CourseStatusDraft     = "draft"
	CourseStatusPublished = "published"
	CourseStatusArchived  = "archived"
)

// Lesson Content Types
const (
	LessonTypeVideo    = "video"
	LessonTypeDocument = "document"
	LessonTypeQuiz     = "quiz"
)

// Transaction Statuses
const (
	TransactionStatusPending = "pending"
	TransactionStatusSuccess = "success"
	TransactionStatusFailed  = "failed"
)

// Auth errors
var (
	ErrAuthTokenMissing       = errors.New("authorization token missing or session expired")
	ErrAuthEmptyJWKS          = errors.New("empty JWKS")
	ErrAuthNoMatchingKey      = errors.New("no matching JWKS key for token")
	ErrAuthInvalidToken       = errors.New("invalid or expired token")
	ErrAuthInvalidClaims      = errors.New("invalid token claims")
	ErrAuthUserBanned         = errors.New("account is banned")
	ErrAuthNoUserContext      = errors.New("user context not found")
	ErrAuthMustChangePassword = errors.New("password change required before API access")
)

// Courses errors
var (
	ErrCoursesCourseNotFound = errors.New("course not found")
	ErrCoursesNotEnrolled    = errors.New("not enrolled in this course")
	ErrCoursesAccessDenied   = errors.New("access denied")
	ErrCoursesNotFree        = errors.New("course is not free")
)

// Updates errors
var (
	ErrUpdatesNotFound     = errors.New("update not found")
	ErrUpdatesAccessDenied = errors.New("access denied")
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

// FAQs errors
var (
	ErrFaqsCourseNotFound = errors.New("course not found")
	ErrFaqsUnauthorized   = errors.New("access denied: you are not the tutor of this course")
	ErrFaqsFaqNotFound    = errors.New("faq not found")
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
	ErrQuizAttemptNotFound  = errors.New("quiz attempt not found")
)

// Coupons errors
var (
	ErrCouponNotFound        = errors.New("coupon not found")
	ErrCouponsUnauthorized   = errors.New("access denied: you do not own this coupon")
	ErrCouponsCourseNotFound = errors.New("associated course not found")
	ErrCouponsCourseRequired = errors.New("course is required for tutor-created coupons")
)

// Transactions errors
var (
	ErrTransactionsInvalidCoupon    = errors.New("invalid coupon")
	ErrTransactionsInvalidSignature = errors.New("invalid webhook signature")
	ErrTransactionsNotFound         = errors.New("transaction not found for this order")
	ErrTransactionsAlreadyEnrolled  = errors.New("user is already enrolled in this course")
	ErrTransactionsCourseIsFree     = errors.New("free courses must be enrolled directly via free enrollment")
	ErrTransactionsPendingExists    = errors.New("a previous purchase attempt is still pending")
)

// Feedbacks errors
var (
	ErrFeedbacksNotEnrolled      = errors.New("access denied: not enrolled in course")
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

// Wishlist errors
var (
	ErrWishlistLimitReached = errors.New("wishlist limit reached")
)

// Centralized Response Messages
const (
	MsgTransactionInitiated     = "Transaction initiated."
	MsgTransactionStatusFetched = "Transaction status fetched."
	MsgCheckoutCourseFetched    = "Checkout course info fetched."
	MsgTransactionsFetched      = "Transactions fetched."
	MsgSignedURLGenerated       = "Signed URL generated successfully."
	MsgEnrolledSuccessfully     = "Enrolled successfully."
	MsgNoteSaved                = "Note saved."
	MsgNoteFetched              = "Note fetched."
	MsgNoteUpdated              = "Note updated."
	MsgNoteDeleted              = "Note deleted."
	MsgFeedbackPosted           = "Feedback posted."
	MsgFeedbackFetched          = "Feedbacks fetched."
	MsgCouponCreated            = "Coupon created."
	MsgCouponChecked            = "Coupon checked."
	MsgQuizSubmitted            = "Quiz submitted successfully."
	MsgCourseCreated            = "Course created successfully."
	MsgCourseUpdated            = "Course updated successfully."
	MsgCourseDeleted            = "Course deleted successfully."
)

// Centralized Error Response Messages
const (
	ErrMsgInvalidRequestBody   = "Invalid request body."
	ErrMsgValidationFailed     = "Validation failed."
	ErrMsgInternalServerError  = "Internal server error"
	ErrMsgTooManyRequests      = "Too many requests. Please try again later."
	ErrMsgInvalidFileName      = "File name query param required."
	ErrMsgUnsafeFileName       = "Invalid or unsafe file name."
	ErrMsgExtensionNotAllowed  = "File extension not allowed."
	ErrMsgInvalidStatusParam   = "Invalid status parameter."
	ErrMsgInvalidDateFrom      = "Invalid date_from format. Use RFC3339 format."
	ErrMsgInvalidDateTo        = "Invalid date_to format. Use RFC3339 format."
	ErrMsgAlreadyEnrolled      = "You are already enrolled in this course."
	ErrMsgFreeCourseDirect     = "Free courses must be enrolled directly."
	ErrMsgWishlistLimitReached = "Wishlist limit reached (max 100 items)"
)
