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
