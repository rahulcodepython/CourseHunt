export const queryKeys = {
  authSession: () => ["auth", "session"] as const,
  categories: () => ["categories"] as const,
  certificates: () => ["certificates"] as const,
  chapters: (courseId: string, scope?: string) =>
    scope ? (["chapters", scope, courseId] as const) : (["chapters", courseId] as const),
  faqs: (courseId: string, scope?: string) =>
    scope ? (["faqs", scope, courseId] as const) : (["faqs", courseId] as const),
  faqsPublic: (courseId: string) => ["faqs", "public", courseId] as const,
  coupons: (scope?: string) =>
    scope ? (["coupons", scope] as const) : (["coupons"] as const),
  couponsAll: () => ["coupons"] as const,
  couponCheck: (code: string, courseId: string) => ["coupons", "check", code, courseId] as const,
  courses: (params?: Record<string, string | number>) =>
    params ? (["courses", params] as const) : (["courses"] as const),
  coursesManage: (params?: Record<string, string | number>) =>
    params ? (["courses", "manage", params] as const) : (["courses", "manage"] as const),
  coursesAdmin: (params?: Record<string, string | number>) =>
    params ? (["courses", "admin", params] as const) : (["courses", "admin"] as const),
  coursesTutor: (params?: Record<string, string | number>) =>
    params ? (["courses", "tutor", params] as const) : (["courses", "tutor"] as const),
  courseById: (id: string, scope?: string) =>
    scope ? (["courses", scope, id] as const) : (["courses", id] as const),
  courseStudy: (id: string) => ["courses", id, "study"] as const,
  courseLanding: (slug: string) => ["courses", "landing", slug] as const,
  dashboardAdmin: () => ["dashboard", "admin"] as const,
  dashboardTutor: () => ["dashboard", "tutor"] as const,
  dashboardUser: () => ["dashboard", "user"] as const,
  discussions: (lessonId: string, scope?: string) =>
    scope ? (["discussions", scope, lessonId] as const) : (["discussions", lessonId] as const),
  discussionReplies: (id: string, scope?: string) =>
    scope ? (["discussions", "replies", scope, id] as const) : (["discussions", "replies", id] as const),
  discussionsAll: () => ["discussions"] as const,
  enrollments: (params: { courseId?: string; userId?: string }, scope?: string) =>
    scope ? (["enrollments", scope, params] as const) : (["enrollments", params] as const),
  enrollmentsAll: () => ["enrollments"] as const,
  feedbacks: (scope?: string) =>
    scope ? (["feedbacks", scope] as const) : (["feedbacks"] as const),
  feedbacksAll: () => ["feedbacks"] as const,
  feedbacksPinned: () => ["feedbacks", "pinned"] as const,
  lessons: (chapterId: string, scope?: string) =>
    scope ? (["lessons", scope, chapterId] as const) : (["lessons", chapterId] as const),
  lessonContent: (id: string, scope?: string) =>
    scope ? (["lessons", scope, id, "content"] as const) : (["lessons", id, "content"] as const),
  lessonResources: (id: string, scope?: string) =>
    scope ? (["lessons", scope, id, "resources"] as const) : (["lessons", id, "resources"] as const),
  studyLessonContent: (id: string) => ["lessons", id, "study-content"] as const,
  studyLessonResources: (id: string) => ["lessons", id, "study-resources"] as const,
  me: () => ["me"] as const,
  coursesEnrolled: () => ["courses", "enrolled"] as const,
  notes: (lessonId: string) => ["notes", lessonId] as const,
  notificationsFeed: () => ["notifications", "feed", "page"] as const,
  notificationsFeedBell: () => ["notifications", "feed", "bell"] as const,
  logsFeed: () => ["logs", "feed"] as const,
  securityFeed: (eventType?: string) =>
    eventType ? (["security", "events", eventType] as const) : (["security", "events"] as const),
  securityStats: () => ["security", "stats"] as const,
  monitoring: () => ["monitoring"] as const,
  health: () => ["health"] as const,
  profileTutor: () => ["profile", "tutor"] as const,
  profileUser: () => ["profile", "user"] as const,
  profilesAdmin: (params?: Record<string, string | number>) =>
    params ? (["profile", "admin", params] as const) : (["profile", "admin"] as const),
  quizMetadata: (lessonId: string, scope?: string) =>
    scope ? (["quiz", scope, "metadata", lessonId] as const) : (["quiz", "metadata", lessonId] as const),
  quizQuestions: (quizId: string, scope?: string) =>
    scope ? (["quiz", scope, "questions", quizId] as const) : (["quiz", "questions", quizId] as const),
  quizAttempts: (quizId: string) => ["quiz", "attempts", quizId] as const,
  quizAttemptDetail: (attemptId: string) => ["quiz", "attempts", "detail", attemptId] as const,
  transactions: (scope?: string) =>
    scope ? (["transactions", scope] as const) : (["transactions"] as const),
  transactionsCheckout: (courseId: string) => ["transactions", "checkout", courseId] as const,
  transactionStatus: (id: string) => ["transactions", "status", id] as const,
  updates: (scope?: string) =>
    scope ? (["updates", scope] as const) : (["updates"] as const),
  updatesAll: () => ["updates"] as const,
  updateFeed: (params?: Record<string, string | number>) =>
    params ? (["updates", "feed", params] as const) : (["updates", "feed"] as const),
  users: (params?: Record<string, string | number>) =>
    params ? (["users", params] as const) : (["users"] as const),
  roles: () => ["roles"] as const,
  permissions: () => ["permissions"] as const,
  wishlist: () => ["wishlist"] as const,
  refunds: (params?: Record<string, string | number>) =>
    params ? (["refunds", params] as const) : (["refunds"] as const),
  myRefunds: (params?: Record<string, string | number>) =>
    params ? (["refunds", "me", params] as const) : (["refunds", "me"] as const),
};
