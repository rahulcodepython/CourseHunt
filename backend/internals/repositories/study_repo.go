package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type StudyRepository struct {
	DB *sql.DB
}

func NewStudyRepository() *StudyRepository {
	return &StudyRepository{DB: database.DB}
}

func (r *StudyRepository) Record(userID string, courseID int) (int, int, int, error) {
	var recordID int
	var completed int
	var last sql.NullInt64
	err := r.DB.QueryRow(`SELECT id, COALESCE(completed_lessons,0), last_viewed_lesson_id FROM course_records WHERE user_id = $1 AND course_id = $2`, userID, courseID).Scan(&recordID, &completed, &last)
	var lastID int
	if last.Valid {
		lastID = int(last.Int64)
	}
	return recordID, completed, lastID, err
}

func (r *StudyRepository) ViewedLessons(recordID int) ([]models.ViewedLesson, error) {
	rows, err := r.DB.Query(`SELECT chapter_id, lesson_id, viewed_at FROM viewed_lessons WHERE course_record_id = $1 ORDER BY viewed_at`, recordID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lessons := []models.ViewedLesson{}
	for rows.Next() {
		var lesson models.ViewedLesson
		if err := rows.Scan(&lesson.ChapterID, &lesson.LessonID, &lesson.ViewedAt); err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}
	return lessons, rows.Err()
}

func (r *StudyRepository) MarkLessonRead(userID string, courseID int, chapterID int, lessonID int) (bool, error) {
	var recordID int
	if err := r.DB.QueryRow(`SELECT id FROM course_records WHERE user_id = $1 AND course_id = $2`, userID, courseID).Scan(&recordID); err != nil {
		return false, err
	}

	var exists int
	if err := r.DB.QueryRow(`SELECT COUNT(1) FROM viewed_lessons WHERE course_record_id = $1 AND chapter_id = $2 AND lesson_id = $3`, recordID, chapterID, lessonID).Scan(&exists); err != nil {
		return false, err
	}
	if exists > 0 {
		return false, nil
	}

	_, err := r.DB.Exec(`INSERT INTO viewed_lessons(course_record_id, chapter_id, lesson_id) VALUES($1, $2, $3); UPDATE course_records SET completed_lessons = completed_lessons + 1, last_viewed_lesson_id = $3 WHERE id = $1`, recordID, chapterID, lessonID)
	return true, err
}

func (r *StudyRepository) SetLastViewed(userID string, courseID int, lessonID int) error {
	_, err := r.DB.Exec(`UPDATE course_records SET last_viewed_lesson_id = $1 WHERE user_id = $2 AND course_id = $3`, lessonID, userID, courseID)
	return err
}

func (r *StudyRepository) UserCourses(userID string, namesOnly bool) ([]models.UserCourse, error) {
	rows, err := r.DB.Query(`
		SELECT c.id, c.title, COALESCE(c.duration,''), COALESCE(c.students,0), COALESCE(c.rating,0),
			COALESCE(c.reviews,0), COALESCE(c.price,0), COALESCE(c.original_price,0),
			COALESCE(c.category_name,''), COALESCE(c.discount,''), COALESCE(c.image_url,''),
			COALESCE(c.image_file_type,''), COALESCE(c.lessons_count,0), COALESCE(cr.completed_lessons,0)
		FROM course_records cr
		JOIN courses c ON c.id = cr.course_id
		WHERE cr.user_id = $1
		ORDER BY c.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	courses := []models.UserCourse{}
	for rows.Next() {
		var id, students, reviews, lessons, completed int
		var title, duration, category, discount, imageURL, imageType string
		var rating, price, original float64
		if err := rows.Scan(&id, &title, &duration, &students, &rating, &reviews, &price, &original, &category, &discount, &imageURL, &imageType, &lessons, &completed); err != nil {
			return nil, err
		}

		item := models.UserCourse{
			ID:               id,
			Title:            title,
			TotalLessons:     lessons,
			CompletedLessons: completed,
			Completed:        lessons > 0 && completed >= lessons,
		}
		if !namesOnly {
			item.Duration = duration
			item.Students = students
			item.Rating = rating
			item.Reviews = reviews
			item.Price = price
			item.OriginalPrice = original
			item.Category = category
			item.Discount = discount
			item.ImageURL = &models.Media{URL: imageURL, FileType: imageType}
		}
		courses = append(courses, item)
	}
	return courses, rows.Err()
}
