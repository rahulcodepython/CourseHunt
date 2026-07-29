-- 010: Missing database indexes for query performance
-- All use IF NOT EXISTS so they are safe to re-run.

-- chapters
CREATE INDEX IF NOT EXISTS idx_chapters_course_chapter ON chapters(course_id, chapter_no);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_null_name ON categories(name) WHERE parent_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- wishlists
CREATE INDEX IF NOT EXISTS idx_wishlists_user_added ON wishlists(user_id, added_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- discussions
CREATE INDEX IF NOT EXISTS idx_discussions_lesson_parent ON discussions(lesson_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_lesson_created ON discussions(lesson_id, created_at DESC);

-- role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user_revoked ON enrollments(user_id, revoked);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_enrolled ON enrollments(course_id, enrolled_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_revoked ON enrollments(course_id, revoked);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_revoked_enrolled ON enrollments(user_id, revoked, enrolled_at DESC);

-- certificates
CREATE INDEX IF NOT EXISTS idx_certificates_user_issued ON certificates(user_id, issued_at DESC);

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_order ON transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_course_created ON transactions(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- courses
CREATE INDEX IF NOT EXISTS idx_courses_slug_status ON courses(slug, status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_courses_status_created ON courses(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_tutor_created ON courses(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_tutor_id ON courses(tutor_id);

-- coupons
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_course_id ON coupons(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_usages_lookup ON coupon_usages(coupon_id, user_id, course_id);

-- lessons
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_lesson ON lessons(chapter_id, lesson_no);

-- lesson_resources
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON lesson_resources(lesson_id);

-- lesson_video_content / lesson_document_content
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_video_lesson ON lesson_video_content(lesson_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_document_lesson ON lesson_document_content(lesson_id);

-- quiz
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_metadata_lesson ON quiz_metadata(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_correct ON quiz_options(question_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_quiz_arrange_question ON quiz_arrange_items(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_fill_answers_question ON quiz_fill_blank_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON quiz_attempts(quiz_id, user_id);

-- feedbacks
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedbacks_course_user ON feedbacks(course_id, user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_course_created ON feedbacks(course_id, created_at DESC);

-- course_updates
CREATE INDEX IF NOT EXISTS idx_course_updates_created ON course_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_updates_course_created ON course_updates(course_id, created_at DESC);

-- update_seen
CREATE INDEX IF NOT EXISTS idx_update_seen_user ON update_seen(user_id);

-- chapter_progress / lesson_progress
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_progress_user ON chapter_progress(chapter_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(lesson_id, user_id);

-- users
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "user"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- webhook_events
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_razorpay ON webhook_events(razorpay_event_id);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
