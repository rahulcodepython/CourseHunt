package repositories

import (
	"database/sql"
	"fmt"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type CourseRepository struct {
	DB *sql.DB
}

func NewCourseRepository() *CourseRepository {
	return &CourseRepository{DB: database.DB}
}

func (r *CourseRepository) Categories() ([]models.Category, error) {
	rows, err := r.DB.Query(`SELECT id, name FROM categories ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := []models.Category{}
	for rows.Next() {
		var category models.Category
		if err := rows.Scan(&category.ID, &category.Name); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}
	return categories, rows.Err()
}

func (r *CourseRepository) Summaries(publishedOnly bool, limit int, userID string, filterByCreator bool) ([]models.CourseSummary, error) {
	query := `
		SELECT id, COALESCE(creator_id, ''), title, COALESCE(description,''), COALESCE(duration,''), COALESCE(students,0),
			COALESCE(rating,0), COALESCE(reviews,0), COALESCE(price,0),
			COALESCE(original_price,0), COALESCE(category_name,''), COALESCE(discount,''),
			COALESCE(total_revenue,0), COALESCE(image_url,''), COALESCE(image_file_type,''), created_at
		FROM courses
		WHERE 1=1
	`
	args := []interface{}{}
	if publishedOnly {
		query += ` AND is_published = true`
	}
	if filterByCreator {
		args = append(args, userID)
		query += fmt.Sprintf(` AND creator_id = $%d`, len(args))
	}
	query += ` ORDER BY created_at DESC`
	if limit > 0 {
		args = append(args, limit)
		query += fmt.Sprintf(` LIMIT $%d`, len(args))
	}

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	courses := []models.CourseSummary{}
	for rows.Next() {
		var course models.CourseSummary
		if err := rows.Scan(&course.ID, &course.CreatorID, &course.Title, &course.Description, &course.Duration, &course.Students, &course.Rating, &course.Reviews, &course.Price, &course.OriginalPrice, &course.Category, &course.Discount, &course.TotalRevenue, &course.ImageURL.URL, &course.ImageURL.FileType, &course.CreatedAt); err != nil {
			return nil, err
		}
		course.LegacyID = course.ID
		courses = append(courses, course)
	}
	return courses, rows.Err()
}

func (r *CourseRepository) FindByID(id int) (*models.CourseDetail, error) {
	row := r.DB.QueryRow(`
		SELECT id, COALESCE(creator_id, ''), title, COALESCE(description,''), COALESCE(duration,''), COALESCE(students,0),
			COALESCE(rating,0), COALESCE(reviews,0), COALESCE(price,0), COALESCE(original_price,0),
			COALESCE(category_id,0), COALESCE(category_name,''), COALESCE(discount,''),
			COALESCE(total_revenue,0), COALESCE(image_url,''), COALESCE(image_file_type,''),
			COALESCE(preview_video_url,''), COALESCE(preview_video_file_type,''),
			COALESCE(long_description,''), COALESCE(chapters_count,0), COALESCE(lessons_count,0),
			COALESCE(is_published,false), created_at, updated_at
		FROM courses
		WHERE id = $1
	`, id)

	var course models.CourseDetail
	if err := row.Scan(&course.ID, &course.CreatorID, &course.Title, &course.Description, &course.Duration, &course.Students, &course.Rating, &course.Reviews, &course.Price, &course.OriginalPrice, &course.CategoryID, &course.Category, &course.Discount, &course.TotalRevenue, &course.ImageURL.URL, &course.ImageURL.FileType, &course.PreviewVideoURL.URL, &course.PreviewVideoURL.FileType, &course.LongDescription, &course.ChaptersCount, &course.LessonsCount, &course.IsPublished, &course.CreatedAt, &course.UpdatedAt); err != nil {
		return nil, err
	}
	course.LegacyID = course.ID

	var err error
	if course.Chapters, err = r.chapters(id, true); err != nil {
		return nil, err
	}
	if course.WhatYouWillLearn, err = r.stringList(`SELECT learning FROM course_learnings WHERE course_id = $1 ORDER BY id`, id); err != nil {
		return nil, err
	}
	if course.Prerequisites, err = r.stringList(`SELECT prerequisite FROM course_prerequisites WHERE course_id = $1 ORDER BY id`, id); err != nil {
		return nil, err
	}
	if course.Requirements, err = r.stringList(`SELECT requirement FROM course_requirements WHERE course_id = $1 ORDER BY id`, id); err != nil {
		return nil, err
	}
	if course.FAQ, err = r.faqs(id); err != nil {
		return nil, err
	}
	if course.Resources, err = r.resources(id); err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *CourseRepository) CreateDefault(title string, creatorID string) (*models.CourseDetail, error) {
	var id int
	err := r.DB.QueryRow(`
		INSERT INTO courses (
			creator_id, title, description, duration, students, rating, reviews, price, original_price,
			category_name, discount, image_url, image_file_type, preview_video_url,
			preview_video_file_type, long_description, chapters_count, lessons_count, is_published
		)
		VALUES ($1, $2, 'Default description', '0 hours', 0, 0, 0, 0, 0, 'Default Category', '0%', '', '', '', '', 'Default long description', 1, 1, false)
		RETURNING id
	`, creatorID, title).Scan(&id)
	if err != nil {
		return nil, err
	}

	_, _ = r.DB.Exec(`
		INSERT INTO course_learnings(course_id, learning) VALUES ($1, 'Default learning point 1'), ($1, 'Default learning point 2');
		INSERT INTO course_prerequisites(course_id, prerequisite) VALUES ($1, 'Default prerequisite 1');
		INSERT INTO course_requirements(course_id, requirement) VALUES ($1, 'Default requirement 1');
		INSERT INTO course_faqs(course_id, question, answer) VALUES ($1, 'Default question?', 'Default answer.')
	`, id)

	var chapterID int
	if err := r.DB.QueryRow(`INSERT INTO chapters(course_id, title, preview, order_index, total_lessons) VALUES($1, 'Default chapter title', false, 0, 1) RETURNING id`, id).Scan(&chapterID); err == nil {
		_, _ = r.DB.Exec(`INSERT INTO lessons(chapter_id, title, duration, type, video_url, video_file_type, content, order_index) VALUES($1, 'Default lesson title', '0 minutes', 'video', '', '', 'Default lesson content', 0)`, chapterID)
	}

	return r.FindByID(id)
}

func (r *CourseRepository) Update(id int, course *models.CourseDetail) (*models.CourseDetail, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		UPDATE courses
		SET creator_id = $1, title = $2, description = $3, duration = $4, students = $5, rating = $6,
			reviews = $7, price = $8, original_price = $9, category_id = NULLIF($10, 0),
			category_name = $11, discount = $12, total_revenue = $13, image_url = $14,
			image_file_type = $15, preview_video_url = $16, preview_video_file_type = $17,
			long_description = $18, chapters_count = $19, lessons_count = $20,
			is_published = $21, updated_at = CURRENT_TIMESTAMP
		WHERE id = $22
	`, course.CreatorID, course.Title, course.Description, course.Duration, course.Students, course.Rating, course.Reviews, course.Price, course.OriginalPrice, course.CategoryID, course.Category, course.Discount, course.TotalRevenue, course.ImageURL.URL, course.ImageURL.FileType, course.PreviewVideoURL.URL, course.PreviewVideoURL.FileType, course.LongDescription, len(course.Chapters), course.LessonsCount, course.IsPublished, id)
	if err != nil {
		return nil, err
	}
	if err := r.replaceChildren(tx, id, course); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *CourseRepository) Delete(id int) error {
	_, err := r.DB.Exec(`DELETE FROM courses WHERE id = $1`, id)
	return err
}

func (r *CourseRepository) chapters(courseID int, includeContent bool) ([]models.Chapter, error) {
	rows, err := r.DB.Query(`SELECT id, title, COALESCE(preview,false), order_index, COALESCE(total_lessons,0) FROM chapters WHERE course_id = $1 ORDER BY order_index, id`, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	chapters := []models.Chapter{}
	for rows.Next() {
		var chapter models.Chapter
		if err := rows.Scan(&chapter.ID, &chapter.Title, &chapter.Preview, &chapter.OrderIndex, &chapter.TotalLessons); err != nil {
			return nil, err
		}
		chapter.LegacyID = chapter.ID
		lessons, err := r.lessons(chapter.ID, includeContent)
		if err != nil {
			return nil, err
		}
		chapter.Lessons = lessons
		chapters = append(chapters, chapter)
	}
	return chapters, rows.Err()
}

func (r *CourseRepository) lessons(chapterID int, includeContent bool) ([]models.Lesson, error) {
	contentExpr := `''`
	if includeContent {
		contentExpr = `COALESCE(content,'')`
	}
	rows, err := r.DB.Query(`SELECT id, title, COALESCE(duration,''), COALESCE(type,'video'), COALESCE(video_url,''), COALESCE(video_file_type,''), `+contentExpr+`, order_index FROM lessons WHERE chapter_id = $1 ORDER BY order_index, id`, chapterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lessons := []models.Lesson{}
	for rows.Next() {
		var lesson models.Lesson
		if err := rows.Scan(&lesson.ID, &lesson.Title, &lesson.Duration, &lesson.Type, &lesson.VideoURL.URL, &lesson.VideoURL.FileType, &lesson.Content, &lesson.OrderIndex); err != nil {
			return nil, err
		}
		lesson.LegacyID = lesson.ID
		lessons = append(lessons, lesson)
	}
	return lessons, rows.Err()
}

func (r *CourseRepository) stringList(query string, id int) ([]string, error) {
	rows, err := r.DB.Query(query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	values := []string{}
	for rows.Next() {
		var value string
		if err := rows.Scan(&value); err != nil {
			return nil, err
		}
		values = append(values, value)
	}
	return values, rows.Err()
}

func (r *CourseRepository) faqs(courseID int) ([]models.FAQ, error) {
	rows, err := r.DB.Query(`SELECT id, question, answer FROM course_faqs WHERE course_id = $1 ORDER BY id`, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.FAQ{}
	for rows.Next() {
		var item models.FAQ
		if err := rows.Scan(&item.ID, &item.Question, &item.Answer); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *CourseRepository) resources(courseID int) ([]models.Resource, error) {
	rows, err := r.DB.Query(`SELECT id, title, file_url, COALESCE(file_type,'') FROM course_resources WHERE course_id = $1 ORDER BY id`, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.Resource{}
	for rows.Next() {
		var item models.Resource
		if err := rows.Scan(&item.ID, &item.Title, &item.FileURL.URL, &item.FileURL.FileType); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *CourseRepository) replaceChildren(tx *sql.Tx, id int, course *models.CourseDetail) error {
	for _, table := range []string{"course_faqs", "course_resources", "course_learnings", "course_prerequisites", "course_requirements", "chapters"} {
		if _, err := tx.Exec(`DELETE FROM `+table+` WHERE course_id = $1`, id); err != nil {
			return err
		}
	}

	lessonCount := 0
	for _, value := range course.WhatYouWillLearn {
		if _, err := tx.Exec(`INSERT INTO course_learnings(course_id, learning) VALUES($1, $2)`, id, value); err != nil {
			return err
		}
	}
	for _, value := range course.Prerequisites {
		if _, err := tx.Exec(`INSERT INTO course_prerequisites(course_id, prerequisite) VALUES($1, $2)`, id, value); err != nil {
			return err
		}
	}
	for _, value := range course.Requirements {
		if _, err := tx.Exec(`INSERT INTO course_requirements(course_id, requirement) VALUES($1, $2)`, id, value); err != nil {
			return err
		}
	}
	for _, item := range course.FAQ {
		if _, err := tx.Exec(`INSERT INTO course_faqs(course_id, question, answer) VALUES($1, $2, $3)`, id, item.Question, item.Answer); err != nil {
			return err
		}
	}
	for _, item := range course.Resources {
		if _, err := tx.Exec(`INSERT INTO course_resources(course_id, title, file_url, file_type) VALUES($1, $2, $3, $4)`, id, item.Title, item.FileURL.URL, item.FileURL.FileType); err != nil {
			return err
		}
	}
	for i, chapter := range course.Chapters {
		var chapterID int
		if err := tx.QueryRow(`INSERT INTO chapters(course_id, title, preview, order_index, total_lessons) VALUES($1, $2, $3, $4, $5) RETURNING id`, id, chapter.Title, chapter.Preview, i, len(chapter.Lessons)).Scan(&chapterID); err != nil {
			return err
		}
		for j, lesson := range chapter.Lessons {
			lessonCount++
			if _, err := tx.Exec(`INSERT INTO lessons(chapter_id, title, duration, type, video_url, video_file_type, content, order_index) VALUES($1, $2, $3, $4, $5, $6, $7, $8)`, chapterID, lesson.Title, lesson.Duration, lesson.Type, lesson.VideoURL.URL, lesson.VideoURL.FileType, lesson.Content, j); err != nil {
				return err
			}
		}
	}

	_, err := tx.Exec(`UPDATE courses SET chapters_count = $1, lessons_count = $2 WHERE id = $3`, len(course.Chapters), lessonCount, id)
	return err
}
