-- Core Business Tables
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    creator_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    students INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    category_id INTEGER REFERENCES categories(id),
    category_name TEXT,
    discount TEXT,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    image_url TEXT,
    image_file_type TEXT,
    preview_video_url TEXT,
    preview_video_file_type TEXT,
    long_description TEXT,
    chapters_count INTEGER DEFAULT 0,
    lessons_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    preview BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    total_lessons INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration TEXT,
    type TEXT CHECK (type IN ('video', 'reading')),
    video_url TEXT,
    video_file_type TEXT,
    content TEXT,
    order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS course_faqs (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_resources (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT
);

CREATE TABLE IF NOT EXISTS course_learnings (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    learning TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_prerequisites (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_requirements (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL
);
