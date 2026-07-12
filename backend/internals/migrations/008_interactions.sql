-- 008: Interactions — discussions, notes, feedbacks, updates, certificates, wishlist, cart

CREATE TABLE IF NOT EXISTS discussions (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id  text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    content    text NOT NULL,
    reply_count INTEGER DEFAULT 0,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discussions_lesson_parent ON discussions(lesson_id, parent_id);

CREATE TABLE IF NOT EXISTS user_notes (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    lesson_id  text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    content    text NOT NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_course ON user_notes(user_id, course_id);

CREATE TABLE IF NOT EXISTS feedbacks (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content    text,
    is_pinned  boolean DEFAULT false,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_course_id ON feedbacks(course_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_pinned ON feedbacks(is_pinned);

-- Trigger: update courses.rating_avg and feedback_count on feedback insert
CREATE OR REPLACE FUNCTION update_course_rating() RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses SET
        rating_avg     = (SELECT AVG(rating) FROM feedbacks WHERE course_id = NEW.course_id),
        feedback_count = (SELECT COUNT(*) FROM feedbacks WHERE course_id = NEW.course_id)
    WHERE id = NEW.course_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_course_rating ON feedbacks;
CREATE TRIGGER trg_course_rating
    AFTER INSERT OR UPDATE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_course_rating();

CREATE TABLE IF NOT EXISTS course_updates (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  text REFERENCES courses(id) ON DELETE CASCADE,  -- null = platform-wide
    created_by text REFERENCES "user"(id) ON DELETE SET NULL,
    message    text NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_updates_course_id  ON course_updates(course_id);
CREATE INDEX IF NOT EXISTS idx_course_updates_created_by ON course_updates(created_by);
CREATE INDEX IF NOT EXISTS idx_course_updates_created_at ON course_updates(created_at DESC);

CREATE TABLE IF NOT EXISTS update_seen (
    id        text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    update_id text NOT NULL REFERENCES course_updates(id) ON DELETE CASCADE,
    seen_at   timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, update_id)
);

CREATE TABLE IF NOT EXISTS certificates (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issued_at  timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

CREATE TABLE IF NOT EXISTS wishlists (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    added_at   timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

CREATE TABLE IF NOT EXISTS cart_items (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    added_at   timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
