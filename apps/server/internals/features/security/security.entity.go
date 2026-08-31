package security

import "time"

// SecurityEvent covers three event_type values: "login" (from the sessions
// trigger), "unauthorized_access" (401/403, from LoggerMiddleware), and
// "rate_limit_exceeded" (429, from RateLimiterMiddleware).
type SecurityEvent struct {
	ID        int64     `json:"id" db:"id"`
	EventType string    `json:"event_type" db:"event_type"`
	UserID    *string   `json:"user_id" db:"user_id"`
	Email     *string   `json:"email" db:"email"`
	IPAddress *string   `json:"ip_address" db:"ip_address"`
	UserAgent *string   `json:"user_agent" db:"user_agent"`
	Path      *string   `json:"path" db:"path"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// SecurityStats backs the security page's stat cards.
type SecurityStats struct {
	LoginsToday          int `json:"logins_today" db:"logins_today"`
	UnauthorizedLast24h  int `json:"unauthorized_last_24h" db:"unauthorized_last_24h"`
	RateLimitHitsLast24h int `json:"rate_limit_hits_last_24h" db:"rate_limit_hits_last_24h"`
	BannedUsers          int `json:"banned_users" db:"banned_users"`
}
