package generic

const (
	// Admin permissions
	AdminCategoriesManage    = "admin:categories:manage"
	AdminCoursesInspect      = "admin:courses:inspect"
	AdminDashboard           = "admin:dashboard"
	AdminDiscussionRead      = "admin:discussion:read"
	AdminDiscussionWrite     = "admin:discussion:write"
	AdminDiscussionDelete    = "admin:discussion:delete"
	AdminEnrollmentsInspect  = "admin:enrollments:inspect"
	AdminCouponsManage       = "admin:coupons:manage"
	AdminFeedbackInspect     = "admin:feedback:inspect"
	AdminTransactionsReadAll = "admin:transactions:read_all"
	AdminUsersList           = "admin:users:list"
	AdminUsersRoleAssign     = "admin:users:role:assign"
	AdminUsersRoleRevoke     = "admin:users:role:revoke"
	AdminProfile             = "admin:profile"

	// Tutor permissions
	TutorCoursesManage     = "tutor:courses:manage"
	TutorDashboard         = "tutor:dashboard"
	TutorDiscussionRead    = "tutor:discussion:read"
	TutorDiscussionWrite   = "tutor:discussion:write"
	TutorDiscussionDelete  = "tutor:discussion:delete"
	TutorFeedbackManage    = "tutor:feedback:manage"
	TutorQuizManage        = "tutor:quiz:manage"
	TutorUpdatesManage     = "tutor:updates:manage"

	TutorProfile           = "tutor:profile"

	// Enrolled permissions
	EnrolledCoursesStudy      = "enrolled:courses:study"
	EnrolledDashboard         = "enrolled:dashboard"
	EnrolledDiscussionRead    = "enrolled:discussion:read"
	EnrolledDiscussionWrite   = "enrolled:discussion:write"
	EnrolledQuizAccess        = "enrolled:quiz:access"
	EnrolledUpdatesFeed       = "enrolled:updates:feed"

	// User permissions
	UserCartManage          = "user:cart:manage"
	UserCertificateManage   = "user:certificate:manage"
	UserEnrollmentsRead     = "user:enrollments:read"
	UserFeedbackCreate      = "user:feedback:create"
	UserNotesManage         = "user:notes:manage"
	UserTransactionsInitiate = "user:transactions:initiate"
	UserTransactionsReadOwn = "user:transactions:read_own"
	UserProfile             = "user:profile"
	UserWishlistManage      = "user:wishlist:manage"
)
