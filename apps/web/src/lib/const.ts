export const API_CONFIG = {
    DEFAULT_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    CONTENT_TYPE_JSON: "application/json",
} as const;

export const AUTH_CONFIG = {
    DEFAULT_APP_URL: "http://localhost:3000",
} as const;

export const ERROR_MESSAGES = {
    UNEXPECTED: "An unexpected error occurred",
    VALIDATION_FAILED: "Response Validation Failed",
    SERVER_PREFETCH_ERROR: "Server prefetch error",
} as const;

export const COOKIES = {
    SESSION_TOKEN: process.env.BETTER_AUTH_SESSION_COOKIE || "better-auth.session_token",
    ACCESS_TOKEN: process.env.ACCESS_TOKEN_COOKIE || "access_token",
    REFRESH_TOKEN: process.env.REFRESH_TOKEN_COOKIE || "refresh_token",
} as const;

export const ROLES = {
    ADMIN: "admin",
    TUTOR: "tutor",
    USER: "user",
} as const;

export const ROUTES = {
    HOME: "/",
    ADMIN_DASHBOARD: "/admin",
    TUTOR_DASHBOARD: "/tutor",
    STUDENT_DASHBOARD: "/student",
    LOGIN: "/auth/login",
    CHANGE_PASSWORD: "/auth/change-password",
    TWO_FACTOR: "/auth/two-factor",
} as const;

// Resolve the post-login landing page for a given account role. Falls back to
// the root route for roles without a dedicated dashboard (handled client-side).
export function getDashboardURI(role?: string | null): string {
    switch (role) {
        case ROLES.ADMIN:
            return ROUTES.ADMIN_DASHBOARD;
        case ROLES.TUTOR:
            return ROUTES.TUTOR_DASHBOARD;
        case ROLES.USER:
            return ROUTES.STUDENT_DASHBOARD;
        default:
            return ROUTES.HOME;
    }
}

export const CSV_CONFIG = {
    CREDENTIALS_HEADERS: ["Name", "Email", "Password", "Role", "Platform URL"],
    MIME_TYPE: "text/csv;charset=utf-8;",
    EXTENSION: ".csv",
} as const;

export const LOCALE_CONFIG = {
    LOCALE: "en-IN",
    CURRENCY_SYMBOL: "₹",
    ELLIPSIS: "…",
} as const;

export const PERMISSIONS = {
    ADMIN_CATEGORIES_MANAGE: "admin:categories:manage",
    ADMIN_COURSES_INSPECT: "admin:courses:inspect",
    ADMIN_DISCUSSION_READ: "admin:discussion:read",
    ADMIN_DISCUSSION_WRITE: "admin:discussion:write",
    ADMIN_DISCUSSION_DELETE: "admin:discussion:delete",
    ADMIN_ENROLLMENTS_INSPECT: "admin:enrollments:inspect",
    ADMIN_COUPONS_MANAGE: "admin:coupons:manage",
    ADMIN_UPDATES_MANAGE: "admin:updates:manage",
    ADMIN_FEEDBACK_INSPECT: "admin:feedback:inspect",
    ADMIN_TRANSACTIONS_READ_ALL: "admin:transactions:read_all",
    ADMIN_USERS_LIST: "admin:users:list",
    ADMIN_USERS_ROLE_ASSIGN: "admin:users:role:assign",
    ADMIN_USERS_ROLE_REVOKE: "admin:users:role:revoke",
    ADMIN_USERS_CREATE: "admin:users:create",
    ADMIN_USERS_READ: "admin:users:read",
    ADMIN_USERS_BAN: "admin:users:ban",
    ADMIN_USERS_PASSWORD_RESET: "admin:users:password:reset",
    ADMIN_ROLES_CREATE: "admin:roles:create",
    ADMIN_ROLES_READ: "admin:roles:read",
    ADMIN_ROLES_UPDATE: "admin:roles:update",
    ADMIN_ROLES_DELETE: "admin:roles:delete",
    ADMIN_ROLES_ASSIGN: "admin:roles:assign",
    ADMIN_PROFILE: "admin:profile",
    ADMIN_REVOKE_COURSE: "admin:revoke:course",
    TUTOR_COURSES_MANAGE: "tutor:courses:manage",
    TUTOR_DISCUSSION_READ: "tutor:discussion:read",
    TUTOR_DISCUSSION_WRITE: "tutor:discussion:write",
    TUTOR_DISCUSSION_DELETE: "tutor:discussion:delete",
    TUTOR_FEEDBACK_MANAGE: "tutor:feedback:manage",
    TUTOR_QUIZ_MANAGE: "tutor:quiz:manage",
    TUTOR_UPDATES_MANAGE: "tutor:updates:manage",
    TUTOR_COUPONS_MANAGE: "tutor:coupons:manage",
} as const;

export const COURSE_STATUS = {
    DRAFT: "draft",
    PUBLISHED: "published",
    ARCHIVED: "archived",
} as const;

export const LESSON_TYPE = {
    VIDEO: "video",
    DOCUMENT: "document",
    QUIZ: "quiz",
} as const;

export const ENROLLMENT_STATUS = {
    ACTIVE: "active",
    REVOKED: "revoked",
} as const;

export const QUESTION_TYPE = {
    SINGLE_CHOICE: "single_choice",
    MULTI_CHOICE: "multi_choice",
    ARRANGE: "arrange",
    FILL_BLANK: "fill_blank",
} as const;

export const API_ENDPOINTS = {
    COURSES: "/api/v1/courses",
    COURSES_MANAGE: "/api/v1/courses/manage",
    COURSES_ENROLLED: "/api/v1/courses/enrolled",
    USERS: "/api/v1/users",
    ROLES: "/api/v1/roles",
    PERMISSIONS: "/api/v1/permissions",
    CATEGORIES: "/api/v1/categories",
    COUPONS: "/api/v1/coupons",
    UPDATES: "/api/v1/updates",
    UPDATES_FEED: "/api/v1/updates/feed",
    FEEDBACKS: "/api/v1/feedbacks",
    FEEDBACKS_PINNED: "/api/v1/feedbacks/pinned",
    TRANSACTIONS: "/api/v1/transactions",
    TRANSACTIONS_INITIATE: "/api/v1/transactions/initiate",
    CERTIFICATES: "/api/v1/certificates",
    DISCUSSIONS: "/api/v1/discussions",
    DASHBOARD_ADMIN: "/api/v1/dashboard/admin",
    DASHBOARD_TUTOR: "/api/v1/dashboard/tutor",
    DASHBOARD_USER: "/api/v1/dashboard/user",
    PROFILE_TUTOR: "/api/v1/profile/tutor",
    PROFILE_USER: "/api/v1/profile/user",
    PROFILE_ADMIN: "/api/v1/profile/admin",
    WISHLIST: "/api/v1/wishlist",
    NOTIFICATIONS: "/api/v1/notifications",
    LOGS: "/api/v1/logs",
    SECURITY_EVENTS: "/api/v1/security/events",
    SECURITY_STATS: "/api/v1/security/stats",
    MONITORING: "/api/v1/monitoring",
    HEALTH: "/api/v1/health",
} as const;

export const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js"

// Filename of the generic placeholder signature image, expected at
// `apps/web/public/<this file>` — swap the actual file in later without
// touching any code that references this const.
export const CERTIFICATE_SIGNATURE_FILENAME = "certificate-signature.png";