-- Stats, Triggers & Performance
CREATE TABLE IF NOT EXISTS global_stats (
    id SERIAL PRIMARY KEY,
    total_users INTEGER DEFAULT 0,
    total_courses INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_enrollments INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize global stats
INSERT INTO global_stats (id, total_users, total_courses, total_revenue, total_enrollments)
SELECT 1, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM global_stats WHERE id = 1);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_published_created ON courses(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_records_user ON course_records(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_course ON feedbacks(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON lessons(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_course ON chapters(course_id, order_index);

-- Trigger Functions
CREATE OR REPLACE FUNCTION update_global_course_stats() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE global_stats SET total_courses = total_courses + 1, last_updated = CURRENT_TIMESTAMP WHERE id = 1;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE global_stats SET total_courses = total_courses - 1, last_updated = CURRENT_TIMESTAMP WHERE id = 1;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_global_user_stats() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE global_stats SET total_users = total_users + 1, last_updated = CURRENT_TIMESTAMP WHERE id = 1;
        
        -- If this is the first user, assign 'admin' role
        IF (SELECT COUNT(*) FROM "user") = 1 THEN
            UPDATE "user" SET "role" = 'admin' WHERE id = NEW.id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE global_stats SET total_users = total_users - 1, last_updated = CURRENT_TIMESTAMP WHERE id = 1;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_enrollment() RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses SET students = students + 1 WHERE id = NEW.course_id;
    UPDATE global_stats SET total_enrollments = total_enrollments + 1, last_updated = CURRENT_TIMESTAMP WHERE id = 1;
    -- Also update user's purchased courses count in profiles
    UPDATE profiles SET purchased_courses = purchased_courses + 1 WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_transaction() RETURNS TRIGGER AS $$
BEGIN
    UPDATE global_stats SET total_revenue = total_revenue + NEW.amount, last_updated = CURRENT_TIMESTAMP WHERE id = 1;
    UPDATE courses SET total_revenue = total_revenue + NEW.amount WHERE id = NEW.course_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_course_rating() RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses 
    SET rating = (SELECT COALESCE(AVG(rating), 0) FROM feedbacks WHERE course_id = NEW.course_id),
        reviews = (SELECT COUNT(*) FROM feedbacks WHERE course_id = NEW.course_id)
    WHERE id = NEW.course_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_chapter_lesson_count() RETURNS TRIGGER AS $$
DECLARE
    target_chapter_id INTEGER;
    target_course_id INTEGER;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        target_chapter_id := NEW.chapter_id;
    ELSE
        target_chapter_id := OLD.chapter_id;
    END IF;

    -- Update chapter's lesson count
    UPDATE chapters SET total_lessons = (SELECT COUNT(*) FROM lessons WHERE chapter_id = target_chapter_id)
    WHERE id = target_chapter_id
    RETURNING course_id INTO target_course_id;

    -- Update course's lesson count
    UPDATE courses SET lessons_count = (SELECT COUNT(*) FROM lessons l JOIN chapters c ON l.chapter_id = c.id WHERE c.course_id = target_course_id)
    WHERE id = target_course_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_course_chapter_count() RETURNS TRIGGER AS $$
DECLARE
    target_course_id INTEGER;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        target_course_id := NEW.course_id;
    ELSE
        target_course_id := OLD.course_id;
    END IF;

    UPDATE courses SET chapters_count = (SELECT COUNT(*) FROM chapters WHERE course_id = target_course_id)
    WHERE id = target_course_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trg_course_stats ON courses;
CREATE TRIGGER trg_course_stats AFTER INSERT OR DELETE ON courses
FOR EACH ROW EXECUTE FUNCTION update_global_course_stats();

DROP TRIGGER IF EXISTS trg_enrollment_stats ON course_enrollments;
CREATE TRIGGER trg_enrollment_stats AFTER INSERT ON course_enrollments
FOR EACH ROW EXECUTE FUNCTION handle_new_enrollment();

DROP TRIGGER IF EXISTS trg_transaction_stats ON transactions;
CREATE TRIGGER trg_transaction_stats AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION handle_new_transaction();

DROP TRIGGER IF EXISTS trg_feedback_rating ON feedbacks;
CREATE TRIGGER trg_feedback_rating AFTER INSERT ON feedbacks
FOR EACH ROW EXECUTE FUNCTION sync_course_rating();

DROP TRIGGER IF EXISTS trg_lesson_count ON lessons;
CREATE TRIGGER trg_lesson_count AFTER INSERT OR DELETE ON lessons
FOR EACH ROW EXECUTE FUNCTION update_chapter_lesson_count();

DROP TRIGGER IF EXISTS trg_chapter_count ON chapters;
CREATE TRIGGER trg_chapter_count AFTER INSERT OR DELETE ON chapters
FOR EACH ROW EXECUTE FUNCTION update_course_chapter_count();

DROP TRIGGER IF EXISTS trg_user_stats ON "user";
CREATE TRIGGER trg_user_stats AFTER INSERT OR DELETE ON "user"
FOR EACH ROW EXECUTE FUNCTION update_global_user_stats();
