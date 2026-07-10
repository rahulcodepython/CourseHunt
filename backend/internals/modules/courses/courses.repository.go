package courses

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

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

func (m *CoursesModule) ReadStudyMetadataRepository(courseID, userID string) (*CourseStudyResponse, error) {
	var resp CourseStudyResponse
	var imageURL sql.NullString
	var chaptersJSON []byte

	query := `
		SELECT 
			c.id, c.title, c.image_url,
			COALESCE(e.completion_percent, 0), COALESCE(e.completed, false),
			(
				SELECT COALESCE(json_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::json)
				FROM (
					SELECT 
						ch.id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds,
						json_build_object(
							'lessons_completed', COALESCE(cp.lessons_completed, 0),
							'completed', COALESCE(cp.completed, false)
						) AS progress,
						(
							SELECT COALESCE(json_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::json)
							FROM (
								SELECT 
									l.id, l.lesson_no, l.title, l.lesson_type, l.duration_seconds,
									COALESCE(lp.completed, false) AS completed
								FROM lessons l
								LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
								WHERE l.chapter_id = ch.id
							) lessons_tree
						) AS lessons
					FROM chapters ch
					LEFT JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = $2
					WHERE ch.course_id = c.id
				) chapters_tree
			) AS chapters_json
		FROM courses c
		LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $2
		WHERE c.id = $1
	`

	err := m.DB.QueryRow(query, courseID, userID).Scan(
		&resp.Course.ID, &resp.Course.Title, &imageURL,
		&resp.Enrollment.CompletionPercent, &resp.Enrollment.Completed,
		&chaptersJSON,
	)
	if err != nil {
		return nil, err
	}

	if imageURL.Valid {
		resp.Course.Thumbnail = &imageURL.String
	}

	if chaptersJSON != nil {
		json.Unmarshal(chaptersJSON, &resp.Chapters)
	}
	if resp.Chapters == nil {
		resp.Chapters = []StudyChapterItem{}
	}

	return &resp, nil
}

func (m *CoursesModule) ReadLandingBySlugRepository(slug, userID string) (*CourseLandingResponse, error) {
	var resp CourseLandingResponse
	var shortDesc, longDesc, imageURL, previewURL, catID, catName, subcatID, subcatName sql.NullString
	var instrID, instrName, instrImage, instrHeadline sql.NullString
	var chaptersJSON []byte

	var uid sql.NullString
	if userID != "" {
		uid = sql.NullString{String: userID, Valid: true}
	}

	query := `
		SELECT 
			c.id, c.slug, c.title, c.short_description, c.long_description, c.image_url, c.preview_video_url, 
			c.language, c.level, c.actual_price, c.final_price, 
			COALESCE(c.benefits, '{}'), COALESCE(c.requirements, '{}'),
			c.total_lectures, c.total_duration_seconds, c.rating_avg, c.feedback_count,
			
			cat.id, cat.name,
			subcat.id, subcat.name,
			
			u.id, u.name, u.image, tp.headline,
			
			EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = $2 AND e.course_id = c.id AND e.revoked = false) AS is_enrolled,
			
			(
				SELECT COALESCE(json_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::json)
				FROM (
					SELECT 
						ch.id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds,
						(
							SELECT COALESCE(json_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::json)
							FROM (
								SELECT l.id, l.lesson_no, l.title, l.lesson_type, l.duration_seconds
								FROM lessons l
								WHERE l.chapter_id = ch.id
							) lessons_tree
						) AS lessons
					FROM chapters ch
					WHERE ch.course_id = c.id
				) chapters_tree
			) AS chapters_json
		FROM courses c
		LEFT JOIN categories cat ON c.category_id = cat.id
		LEFT JOIN categories subcat ON c.subcategory_id = subcat.id
		LEFT JOIN "user" u ON c.tutor_id = u.id
		LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
		WHERE c.slug = $1
	`

	err := m.DB.QueryRow(query, slug, uid).Scan(
		&resp.ID, &resp.Slug, &resp.Title, &shortDesc, &longDesc, &imageURL, &previewURL,
		&resp.Language, &resp.Level, &resp.ActualPrice, &resp.FinalPrice,
		pq.Array(&resp.Benefits), pq.Array(&resp.Requirements),
		&resp.TotalLectures, &resp.TotalDurationSeconds, &resp.RatingAvg, &resp.FeedbackCount,

		&catID, &catName,
		&subcatID, &subcatName,

		&instrID, &instrName, &instrImage, &instrHeadline,

		&resp.IsEnrolled,
		&chaptersJSON,
	)
	if err != nil {
		return nil, err
	}

	if shortDesc.Valid {
		resp.ShortDescription = &shortDesc.String
	}
	if longDesc.Valid {
		resp.LongDescription = &longDesc.String
	}
	if imageURL.Valid {
		resp.ImageURL = &imageURL.String
	}
	if previewURL.Valid {
		resp.PreviewVideoURL = &previewURL.String
	}

	if catID.Valid && catName.Valid {
		resp.Category = &models.CategoryInfo{ID: catID.String, Name: catName.String}
	}
	if subcatID.Valid && subcatName.Valid {
		resp.Subcategory = &models.CategoryInfo{ID: subcatID.String, Name: subcatName.String}
	}
	if instrID.Valid {
		resp.Instructor.ID = instrID.String
		if instrName.Valid {
			resp.Instructor.Name = instrName.String
		}
		if instrImage.Valid {
			resp.Instructor.Image = &instrImage.String
		}
		if instrHeadline.Valid {
			resp.Instructor.Headline = &instrHeadline.String
		}
	}

	if chaptersJSON != nil {
		json.Unmarshal(chaptersJSON, &resp.Chapters)
	}
	if resp.Chapters == nil {
		resp.Chapters = []ChapterCardResponse{}
	}

	return &resp, nil
}

func (m *CoursesModule) ListRepository(page, limit int, categoryID, level, search, tutorID, status string) ([]CourseCardResponse, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1

	if status != "" {
		where = append(where, fmt.Sprintf("c.status = $%d", idx))
		args = append(args, status)
		idx++
	} else {
		where = append(where, "c.status = 'published'")
	}
	if categoryID != "" {
		where = append(where, fmt.Sprintf("c.category_id = $%d", idx))
		args = append(args, categoryID)
		idx++
	}
	if level != "" {
		where = append(where, fmt.Sprintf("c.level = $%d", idx))
		args = append(args, level)
		idx++
	}
	if search != "" {
		where = append(where, fmt.Sprintf("(c.title ILIKE $%d OR c.short_description ILIKE $%d)", idx, idx))
		args = append(args, "%"+search+"%")
		idx++
	}
	if tutorID != "" {
		where = append(where, fmt.Sprintf("c.tutor_id = $%d", idx))
		args = append(args, tutorID)
		idx++
	}

	whereStr := strings.Join(where, " AND ")

	var total int
	m.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM courses c WHERE %s", whereStr), args...).Scan(&total)

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	rows, err := m.DB.Query(fmt.Sprintf(`
		SELECT c.id, c.slug, c.title, c.short_description, c.image_url,
		       c.actual_price, c.final_price, COALESCE(c.benefits, '{}'),
		       c.level, c.rating_avg, c.feedback_count,
		       u.id, u.name, u.image
		FROM courses c
		LEFT JOIN "user" u ON u.id = c.tutor_id
		WHERE %s
		ORDER BY c.created_at DESC LIMIT $%d OFFSET $%d`, whereStr, idx, idx+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var cards []CourseCardResponse
	for rows.Next() {
		var card CourseCardResponse
		var shortDesc, imageURL, instrID, instrName, instrImage sql.NullString
		if err := rows.Scan(
			&card.ID, &card.Slug, &card.Title, &shortDesc, &imageURL,
			&card.ActualPrice, &card.FinalPrice, pq.Array(&card.Benefits),
			&card.Level, &card.RatingAvg, &card.FeedbackCount,
			&instrID, &instrName, &instrImage,
		); err != nil {
			return nil, 0, err
		}
		if shortDesc.Valid {
			card.ShortDescription = &shortDesc.String
		}
		if imageURL.Valid {
			card.ImageURL = &imageURL.String
		}
		if instrID.Valid {
			card.Instructor.ID = instrID.String
			if instrName.Valid {
				card.Instructor.Name = instrName.String
			}
			if instrImage.Valid {
				card.Instructor.Image = &instrImage.String
			}
		}
		cards = append(cards, card)
	}
	if cards == nil {
		cards = []CourseCardResponse{}
	}
	return cards, total, rows.Err()
}

func (m *CoursesModule) EnrolledCoursesRepository(userID string) ([]EnrolledCourseResponse, error) {
	rows, err := m.DB.Query(`
		SELECT c.id, c.slug, c.title, c.image_url, e.completion_percent, e.last_accessed_lesson_id
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
		if err := rows.Scan(&resp.ID, &resp.Slug, &resp.Title, &resp.ImageURL, &resp.CompletionPercent, &resp.LastAccessedLessonID); err != nil {
			return nil, err
		}
		list = append(list, resp)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if list == nil {
		list = []EnrolledCourseResponse{}
	}
	return list, nil
}

func (m *CoursesModule) IsCourseOwnerRepository(tutorID, courseID string) bool {
	var exists bool
	err := m.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM courses WHERE id = $1 AND tutor_id = $2)`, courseID, tutorID).Scan(&exists)
	if err != nil {
		return false
	}
	return exists
}
