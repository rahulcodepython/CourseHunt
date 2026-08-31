DROP INDEX IF EXISTS idx_courses_title_trgm;
DROP INDEX IF EXISTS idx_courses_slug;
DROP INDEX IF EXISTS idx_courses_category_id;
DROP INDEX IF EXISTS idx_courses_status;
DROP INDEX IF EXISTS idx_courses_tutor_id;
DROP TABLE IF EXISTS courses;
DROP EXTENSION IF EXISTS "pg_trgm";
