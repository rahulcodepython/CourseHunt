CREATE TABLE IF NOT EXISTS discussions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES discussions(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    reply_count INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discussions_lesson_parent ON discussions(lesson_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_lesson_created ON discussions(lesson_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    lesson_id  UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_notes_user_course ON notes(user_id, course_id);

CREATE TABLE IF NOT EXISTS feedbacks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CONSTRAINT feedbacks_rating_check CHECK (rating >= 1 AND rating <= 5),
    content    TEXT,
    is_pinned  BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_course_id ON feedbacks(course_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_pinned ON feedbacks(is_pinned);
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedbacks_course_user ON feedbacks(course_id, user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_course_created ON feedbacks(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_course_rating ON feedbacks(course_id, rating DESC) WHERE is_pinned = false;

CREATE TABLE IF NOT EXISTS updates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID REFERENCES "users"(id) ON DELETE SET NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_updates_course_id  ON updates(course_id);
CREATE INDEX IF NOT EXISTS idx_updates_created_by ON updates(created_by);
CREATE INDEX IF NOT EXISTS idx_updates_created_at ON updates(created_at DESC);

CREATE TABLE IF NOT EXISTS update_seen (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    update_id UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
    seen_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, update_id)
);

CREATE INDEX IF NOT EXISTS idx_update_seen_user_id ON update_seen(user_id);
CREATE INDEX IF NOT EXISTS idx_update_seen_update_id ON update_seen(update_id);

CREATE TABLE IF NOT EXISTS certificates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issued_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_issued ON certificates(user_id, issued_at DESC);

CREATE TABLE IF NOT EXISTS wishlists (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_added ON wishlists(user_id, added_at DESC);

CREATE TABLE IF NOT EXISTS cart_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
