BEGIN;

CREATE TABLE IF NOT EXISTS certificates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issued_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

COMMIT;
