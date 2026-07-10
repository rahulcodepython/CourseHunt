// =============================================================================
// Query Keys
// =============================================================================
// Single source of truth for cache keys, shared across every file in
// hooks/api/. Kept as one file (not one per domain) so e.g. a course
// mutation can invalidate both ["courses"] and ["dashboard"] without
// importing hooks/api/dashboard.ts just to reach its key.
//
// Convention: each entry is a function, even when it takes no arguments —
// keeps every usage site consistent (`queryKeys.feedbacks()`, not a mix of
// `queryKeys.feedbacks` and `queryKeys.course(id)`).

export const queryKeys = {
	cart: () => ["cart"] as const,
	categories: () => ["categories"] as const,
	certificates: () => ["certificates"] as const,
	certificate: (courseId: string) => ["certificates", courseId] as const,
	chapters: (courseId: string) => ["chapters", courseId] as const,
	coupons: () => ["coupons"] as const,
	couponCheck: () => ["coupons", "check"] as const,
	courses: () => ["courses"] as const,
	courseStudy: (id: string) => ["courses", id, "study"] as const,
	courseLanding: (slug: string) => ["courses", "landing", slug] as const,
	dashboardAdmin: () => ["dashboard", "admin"] as const,
	dashboardTutor: () => ["dashboard", "tutor"] as const,
	dashboardUser: () => ["dashboard", "user"] as const,
	discussions: (lessonId: string) => ["discussions", lessonId] as const,
	discussionReplies: (id: string) => ["discussions", "replies", id] as const,
	enrollments: () => ["enrollments"] as const,
	feedbacks: () => ["feedbacks"] as const,
	lessons: (chapterId: string) => ["lessons", chapterId] as const,
	lessonContent: (id: string) => ["lessons", id, "content"] as const,
	lessonSignedUrl: (id: string) => ["lessons", id, "signed-url"] as const,
	me: () => ["me"] as const,
	meEnrolled: () => ["me", "enrolled"] as const,
	notes: (lessonId: string) => ["notes", lessonId] as const,
	profileTutor: (id: string) => ["profile", "tutor", id] as const,
	profileUser: () => ["profile", "user"] as const,
	transactions: () => ["transactions"] as const,
	transactionsMe: () => ["transactions", "me"] as const,
	updates: () => ["updates"] as const,
	updateFeed: () => ["updates", "feed"] as const,
	users: () => ["users"] as const,
	wishlist: () => ["wishlist"] as const,
};