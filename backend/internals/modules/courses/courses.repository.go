package courses

import (
	"database/sql"
	"fmt"
	"strings"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"coursehunt-backend/internals/modules/profile"
	"coursehunt-backend/internals/modules/users"

	"github.com/lib/pq"
)

func (m *CoursesModule) CreateRepository(tutorID string, req CreateCourseRequest) (*CourseCreatedResponse, error) {
	slug := utils.Slugify(req.Title)
	level := req.Level
	if level == "" {
		level = "all"
	}
	status := req.Status
	if status == "" {
		status = "draft"
	}
	var resp CourseCreatedResponse
	err := m.DB.QueryRow(`
		INSERT INTO courses (tutor_id, slug, title, short_description, category_id, subcategory_id, language, level, status, benefits, requirements)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, slug, title, status, created_at`,
		tutorID, slug, req.Title, req.ShortDescription, req.CategoryID, req.SubcategoryID,
		req.Language, level, status,
		pq.Array([]string{}), pq.Array([]string{}),
	).Scan(&resp.ID, &resp.Slug, &resp.Title, &resp.Status, &resp.CreatedAt)
	return &resp, err
}

func (m *CoursesModule) UpdateRepository(id string, req UpdateCourseRequest) (*Course, error) {
	setClauses := []string{"updated_at = CURRENT_TIMESTAMP"}
	var args []interface{}
	argIdx := 1

	if req.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.ShortDescription != nil {
		setClauses = append(setClauses, fmt.Sprintf("short_description = $%d", argIdx))
		args = append(args, *req.ShortDescription)
		argIdx++
	}
	if req.LongDescription != nil {
		setClauses = append(setClauses, fmt.Sprintf("long_description = $%d", argIdx))
		args = append(args, *req.LongDescription)
		argIdx++
	}
	if req.ImageURL != nil {
		setClauses = append(setClauses, fmt.Sprintf("image_url = $%d", argIdx))
		args = append(args, *req.ImageURL)
		argIdx++
	}
	if req.PreviewVideoURL != nil {
		setClauses = append(setClauses, fmt.Sprintf("preview_video_url = $%d", argIdx))
		args = append(args, *req.PreviewVideoURL)
		argIdx++
	}
	if req.Language != nil {
		setClauses = append(setClauses, fmt.Sprintf("language = $%d", argIdx))
		args = append(args, *req.Language)
		argIdx++
	}
	if req.Level != nil {
		setClauses = append(setClauses, fmt.Sprintf("level = $%d", argIdx))
		args = append(args, *req.Level)
		argIdx++
	}
	if req.ActualPrice != nil {
		setClauses = append(setClauses, fmt.Sprintf("actual_price = $%d", argIdx))
		args = append(args, *req.ActualPrice)
		argIdx++
	}
	if req.FinalPrice != nil {
		setClauses = append(setClauses, fmt.Sprintf("final_price = $%d", argIdx))
		args = append(args, *req.FinalPrice)
		argIdx++
	}
	if req.Benefits != nil {
		setClauses = append(setClauses, fmt.Sprintf("benefits = $%d", argIdx))
		args = append(args, pq.Array(req.Benefits))
		argIdx++
	}
	if req.Requirements != nil {
		setClauses = append(setClauses, fmt.Sprintf("requirements = $%d", argIdx))
		args = append(args, pq.Array(req.Requirements))
		argIdx++
	}
	if req.CategoryID != nil {
		setClauses = append(setClauses, fmt.Sprintf("category_id = $%d", argIdx))
		args = append(args, *req.CategoryID)
		argIdx++
	}
	if req.SubcategoryID != nil {
		setClauses = append(setClauses, fmt.Sprintf("subcategory_id = $%d", argIdx))
		args = append(args, *req.SubcategoryID)
		argIdx++
	}
	if req.CouponAllowed != nil {
		setClauses = append(setClauses, fmt.Sprintf("coupon_allowed = $%d", argIdx))
		args = append(args, *req.CouponAllowed)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	args = append(args, id)
	query := fmt.Sprintf("UPDATE courses SET %s WHERE id = $%d RETURNING id, tutor_id, slug, title, short_description, long_description, image_url, preview_video_url, language, level, actual_price, final_price, COALESCE(benefits, '{}'), COALESCE(requirements, '{}'), category_id, subcategory_id, coupon_allowed, total_lectures, total_duration_seconds, rating_avg, feedback_count, status, created_at, updated_at", strings.Join(setClauses, ", "), argIdx)
	var c Course
	err := m.DB.QueryRow(query, args...).Scan(
		&c.ID, &c.TutorID, &c.Slug, &c.Title,
		&c.ShortDescription, &c.LongDescription, &c.ImageURL, &c.PreviewVideoURL,
		&c.Language, &c.Level, &c.ActualPrice, &c.FinalPrice,
		pq.Array(&c.Benefits), pq.Array(&c.Requirements),
		&c.CategoryID, &c.SubcategoryID, &c.CouponAllowed,
		&c.TotalLectures, &c.TotalDurationSeconds, &c.RatingAvg, &c.FeedbackCount,
		&c.Status, &c.CreatedAt, &c.UpdatedAt,
	)
	return &c, err
}

func (m *CoursesModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM courses WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}

func (m *CoursesModule) ReadRepository(id, userID string) (*Course, float64, bool, error) {
	var c Course
	var completionPercent sql.NullFloat64
	var completed sql.NullBool
	err := m.DB.QueryRow(`
		SELECT c.id, c.tutor_id, c.slug, c.title, c.short_description, c.long_description, c.image_url,
		       c.preview_video_url, c.language, c.level, c.actual_price, c.final_price,
		       COALESCE(c.benefits, '{}'), COALESCE(c.requirements, '{}'),
		       c.category_id, c.subcategory_id, c.coupon_allowed,
		       c.total_lectures, c.total_duration_seconds, c.rating_avg, c.feedback_count,
		       c.status, c.created_at, c.updated_at,
			   e.completion_percent, e.completed
		FROM courses c
		LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $2
		WHERE c.id = $1`, id, userID).Scan(
		&c.ID, &c.TutorID, &c.Slug, &c.Title,
		&c.ShortDescription, &c.LongDescription, &c.ImageURL, &c.PreviewVideoURL,
		&c.Language, &c.Level, &c.ActualPrice, &c.FinalPrice,
		pq.Array(&c.Benefits), pq.Array(&c.Requirements),
		&c.CategoryID, &c.SubcategoryID, &c.CouponAllowed,
		&c.TotalLectures, &c.TotalDurationSeconds, &c.RatingAvg, &c.FeedbackCount,
		&c.Status, &c.CreatedAt, &c.UpdatedAt,
		&completionPercent, &completed,
	)
	return &c, completionPercent.Float64, completed.Bool, err
}

func (m *CoursesModule) ReadBySlugRepository(slug string) (*Course, error) {
	var c Course
	err := m.DB.QueryRow(`
		SELECT id, tutor_id, slug, title, short_description, long_description, image_url,
		       preview_video_url, language, level, actual_price, final_price,
		       COALESCE(benefits, '{}'), COALESCE(requirements, '{}'),
		       category_id, subcategory_id, coupon_allowed,
		       total_lectures, total_duration_seconds, rating_avg, feedback_count,
		       status, created_at, updated_at
		FROM courses WHERE slug = $1`, slug).Scan(
		&c.ID, &c.TutorID, &c.Slug, &c.Title,
		&c.ShortDescription, &c.LongDescription, &c.ImageURL, &c.PreviewVideoURL,
		&c.Language, &c.Level, &c.ActualPrice, &c.FinalPrice,
		pq.Array(&c.Benefits), pq.Array(&c.Requirements),
		&c.CategoryID, &c.SubcategoryID, &c.CouponAllowed,
		&c.TotalLectures, &c.TotalDurationSeconds, &c.RatingAvg, &c.FeedbackCount,
		&c.Status, &c.CreatedAt, &c.UpdatedAt,
	)
	return &c, err
}

func (m *CoursesModule) ListRepository(page, limit int, categoryID, level, search, tutorID, status string) ([]Course, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1

	if status != "" {
		where = append(where, fmt.Sprintf("status = $%d", idx))
		args = append(args, status)
		idx++
	} else {
		where = append(where, "status = 'published'")
	}
	if categoryID != "" {
		where = append(where, fmt.Sprintf("category_id = $%d", idx))
		args = append(args, categoryID)
		idx++
	}
	if level != "" {
		where = append(where, fmt.Sprintf("level = $%d", idx))
		args = append(args, level)
		idx++
	}
	if search != "" {
		where = append(where, fmt.Sprintf("(title ILIKE $%d OR short_description ILIKE $%d)", idx, idx))
		args = append(args, "%"+search+"%")
		idx++
	}
	if tutorID != "" {
		where = append(where, fmt.Sprintf("tutor_id = $%d", idx))
		args = append(args, tutorID)
		idx++
	}

	whereStr := strings.Join(where, " AND ")

	var total int
	m.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM courses WHERE %s", whereStr), args...).Scan(&total)

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	rows, err := m.DB.Query(fmt.Sprintf(`
		SELECT id, tutor_id, slug, title, short_description, long_description, image_url,
		       preview_video_url, language, level, actual_price, final_price,
		       COALESCE(benefits, '{}'), COALESCE(requirements, '{}'),
		       category_id, subcategory_id, coupon_allowed,
		       total_lectures, total_duration_seconds, rating_avg, feedback_count,
		       status, created_at, updated_at
		FROM courses WHERE %s
		ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, whereStr, idx, idx+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var courses []Course
	for rows.Next() {
		var c Course
		if err := rows.Scan(
			&c.ID, &c.TutorID, &c.Slug, &c.Title,
			&c.ShortDescription, &c.LongDescription, &c.ImageURL, &c.PreviewVideoURL,
			&c.Language, &c.Level, &c.ActualPrice, &c.FinalPrice,
			pq.Array(&c.Benefits), pq.Array(&c.Requirements),
			&c.CategoryID, &c.SubcategoryID, &c.CouponAllowed,
			&c.TotalLectures, &c.TotalDurationSeconds, &c.RatingAvg, &c.FeedbackCount,
			&c.Status, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		courses = append(courses, c)
	}
	if courses == nil {
		courses = []Course{}
	}
	return courses, total, rows.Err()
}

// GetTutorUserRepository returns the user row for a course's tutor.
func (m *CoursesModule) GetTutorUserRepository(tutorID string) (*users.User, *profile.TutorProfile, error) {
	var u users.User
	err := m.DB.QueryRow(`SELECT id, name, email, "emailVerified", image, banned, "createdAt", "updatedAt" FROM "user" WHERE id = $1`, tutorID).
		Scan(&u.ID, &u.Name, &u.Email, &u.EmailVerified, &u.Image, &u.Banned, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, nil, err
	}
	var tp profile.TutorProfile
	m.DB.QueryRow(`SELECT id, user_id, headline, bio, website, total_students, rating_avg FROM tutor_profile WHERE user_id = $1`, tutorID).
		Scan(&tp.ID, &tp.UserID, &tp.Headline, &tp.Bio, &tp.Website, &tp.TotalStudents, &tp.RatingAvg)
	return &u, &tp, nil
}

func (m *CoursesModule) GetCategoryInfoRepository(catID string) *models.CategoryInfo {
	var ci models.CategoryInfo
	m.DB.QueryRow(`SELECT id, name FROM categories WHERE id = $1`, catID).Scan(&ci.ID, &ci.Name)
	if ci.ID == "" {
		return nil
	}
	return &ci
}

func (m *CoursesModule) GetSubcategoryInfoRepository(subID string) *models.CategoryInfo {
	var ci models.CategoryInfo
	m.DB.QueryRow(`SELECT id, name FROM subcategories WHERE id = $1`, subID).Scan(&ci.ID, &ci.Name)
	if ci.ID == "" {
		return nil
	}
	return &ci
}

// EnrolledCoursesRepository returns the courses a user is enrolled in.
func (m *CoursesModule) EnrolledCoursesRepository(userID string) ([]EnrolledCourseResponse, error) {
	rows, err := m.DB.Query(`
		SELECT c.id, c.slug, c.title, c.image_url, c.tutor_id,
		       e.completion_percent, e.last_accessed_lesson_id
		FROM enrollments e
		JOIN courses c ON c.id = e.course_id
		WHERE e.user_id = $1 AND e.revoked = false
		ORDER BY e.enrolled_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []EnrolledCourseResponse
	for rows.Next() {
		var resp EnrolledCourseResponse
		var tutorID sql.NullString
		if err := rows.Scan(&resp.ID, &resp.Slug, &resp.Title, &resp.ImageURL, &tutorID, &resp.CompletionPercent, &resp.LastAccessedLessonID); err != nil {
			return nil, err
		}
		if tutorID.Valid {
			u, _, _ := m.GetTutorUserRepository(tutorID.String)
			if u != nil {
				resp.Instructor = models.InstructorInfo{ID: u.ID, Name: u.Name, Image: u.Image}
			}
		}
		list = append(list, resp)
	}
	if list == nil {
		list = []EnrolledCourseResponse{}
	}
	return list, rows.Err()
}

func (m *CoursesModule) FetchCourseTreeJSON(courseID, userID string) ([]byte, error) {
	var jsonData []byte
	query := `
        SELECT COALESCE(json_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::json)
        FROM (
            SELECT 
                ch.id, 
                ch.chapter_no, 
                ch.title, 
                ch.total_lectures, 
                ch.total_duration_seconds,
                json_build_object(
                    'lessons_completed', COALESCE(cp.lessons_completed, 0),
                    'completed', COALESCE(cp.completed, false)
                ) AS progress,
                (
                    SELECT COALESCE(json_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::json)
                    FROM (
                        SELECT 
                            l.id, 
                            l.lesson_no, 
                            l.title, 
                            l.lesson_type, 
                            l.duration_seconds,
                            COALESCE(lp.completed, false) AS completed
                        FROM lessons l
                        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
                        WHERE l.chapter_id = ch.id
                    ) lessons_tree
                ) AS lessons
            FROM chapters ch
            LEFT JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = $2
            WHERE ch.course_id = $1
        ) chapters_tree`
	err := m.DB.QueryRow(query, courseID, userID).Scan(&jsonData)
	return jsonData, err
}

func (m *CoursesModule) FetchCourseLandingTreeJSON(courseID string) ([]byte, error) {
	var jsonData []byte
	query := `
        SELECT COALESCE(json_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::json)
        FROM (
            SELECT 
                ch.id, 
                ch.chapter_no, 
                ch.title, 
                ch.total_lectures, 
                ch.total_duration_seconds,
                (
                    SELECT COALESCE(json_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::json)
                    FROM (
                        SELECT 
                            l.id, 
                            l.lesson_no, 
                            l.title, 
                            l.lesson_type, 
                            l.duration_seconds,
                            l.short_description,
                            l.preview_video_url
                        FROM lessons l
                        WHERE l.chapter_id = ch.id
                    ) lessons_tree
                ) AS lessons
            FROM chapters ch
            WHERE ch.course_id = $1
        ) chapters_tree`
	err := m.DB.QueryRow(query, courseID).Scan(&jsonData)
	return jsonData, err
}
