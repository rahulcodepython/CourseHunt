export const API_CONFIG = {
    DEFAULT_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    CONTENT_TYPE_JSON: "application/json",
} as const;

export const AUTH_CONFIG = {
    DEFAULT_APP_URL: "http://coursehunt.localhost:3000",
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
    LOGIN: "/auth/login",
    CHANGE_PASSWORD: "/auth/change-password",
} as const;

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