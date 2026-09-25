-- Migration 000011: Enterprise LMS Features
-- 1. Video Playback & Watch Time Tracking
ALTER TABLE lesson_progress
    ADD COLUMN IF NOT EXISTS playback_seconds INTEGER DEFAULT 0 CONSTRAINT lesson_progress_playback_seconds_check CHECK (playback_seconds >= 0),
    ADD COLUMN IF NOT EXISTS total_watch_time_seconds INTEGER DEFAULT 0 CONSTRAINT lesson_progress_total_watch_time_seconds_check CHECK (total_watch_time_seconds >= 0),
    ADD COLUMN IF NOT EXISTS last_watched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 2. User Learning Streaks
CREATE TABLE IF NOT EXISTS user_learning_streaks (
    user_id UUID PRIMARY KEY REFERENCES "users"(id) ON DELETE CASCADE,
    current_streak_days INTEGER NOT NULL DEFAULT 0 CONSTRAINT streak_current_positive CHECK (current_streak_days >= 0),
    longest_streak_days INTEGER NOT NULL DEFAULT 0 CONSTRAINT streak_longest_positive CHECK (longest_streak_days >= 0),
    last_active_date DATE DEFAULT CURRENT_DATE,
    total_study_minutes INTEGER NOT NULL DEFAULT 0 CONSTRAINT streak_study_minutes_positive CHECK (total_study_minutes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_learning_streaks_active ON user_learning_streaks(last_active_date);

-- 3. Drip Content Scheduling & Prerequisites in Chapters
ALTER TABLE chapters
    ADD COLUMN IF NOT EXISTS unlock_days_after_enrollment INTEGER DEFAULT 0 CONSTRAINT chapters_unlock_days_check CHECK (unlock_days_after_enrollment >= 0),
    ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS prerequisite_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chapters_prerequisite ON chapters(prerequisite_chapter_id);

-- 4. Tutor Payout Profiles & Revenue Sharing
CREATE TABLE IF NOT EXISTS tutor_payout_profiles (
    user_id UUID PRIMARY KEY REFERENCES "users"(id) ON DELETE CASCADE,
    commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 80.00 CONSTRAINT check_commission_percentage CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    bank_account_number TEXT,
    bank_ifsc_code TEXT,
    upi_id TEXT,
    payout_mode TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payout_mode IN ('bank_transfer', 'upi', 'manual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tutor Payout Transactions Ledger
CREATE TABLE IF NOT EXISTS tutor_payout_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CONSTRAINT check_payout_amount CHECK (amount >= 0),
    platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00 CONSTRAINT check_payout_fee CHECK (platform_fee >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    reference_id TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutor_payout_tutor ON tutor_payout_transactions(tutor_id, status);
CREATE INDEX IF NOT EXISTS idx_tutor_payout_created ON tutor_payout_transactions(created_at DESC);

-- 6. Assignments Under Lessons
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100 CONSTRAINT check_max_score CHECK (max_score > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);

-- 7. Student Assignment Submissions & Grading
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    score INTEGER CONSTRAINT check_submission_score CHECK (score >= 0),
    feedback_notes TEXT,
    graded_by UUID REFERENCES "users"(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmission_requested')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
