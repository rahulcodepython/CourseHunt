-- Tracks each user's read cursor into the shared notifications feed — one
-- row per user, advanced to the newest id every time they successfully
-- fetch a page (see NotificationsRepository.ListRepository).

CREATE TABLE IF NOT EXISTS notification_seen (
    user_id                    UUID PRIMARY KEY REFERENCES "users"(id) ON DELETE CASCADE,
    last_seen_notification_id BIGINT REFERENCES notifications(id) ON DELETE SET NULL,
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
