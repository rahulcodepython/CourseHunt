-- User Interactions & Progress Tracking
CREATE TABLE IF NOT EXISTS course_enrollments (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS course_records (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    completed_lessons INTEGER DEFAULT 0,
    last_viewed_lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS viewed_lessons (
    id SERIAL PRIMARY KEY,
    course_record_id INTEGER REFERENCES course_records(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_record_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 0 AND rating <= 5),
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    certificate_url TEXT NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);
