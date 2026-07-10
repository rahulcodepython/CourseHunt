package courses

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/modules/enrollments"

	"database/sql"
	"encoding/json"
	"fmt"
)

func (m *CoursesModule) CreateService(tutorID string, req CreateCourseRequest) (*CourseCreatedResponse, error) {
	return m.CreateRepository(tutorID, req)
}

func (m *CoursesModule) UpdateService(id string, req UpdateCourseRequest) (*Course, error) {
	return m.UpdateRepository(id, req)
}

func (m *CoursesModule) DeleteService(id string) (string, error) {
	return m.DeleteRepository(id)
}

// ListService returns a paginated list of courses with enriched card data.
func (m *CoursesModule) ListService(page, limit int, categoryID, level, search, tutorID, status string) ([]CourseCardResponse, int, error) {
	coursesList, total, err := m.ListRepository(page, limit, categoryID, level, search, tutorID, status)
	if err != nil {
		return nil, 0, err
	}
	cards := make([]CourseCardResponse, 0, len(coursesList))
	for _, c := range coursesList {
		card := m.toCard(c)
		cards = append(cards, card)
	}
	return cards, total, nil
}

func (m *CoursesModule) ReadLandingService(slug, userID string) (*CourseLandingResponse, error) {
	c, err := m.ReadBySlugRepository(slug)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("not found")
	}
	if err != nil {
		return nil, err
	}

	resp := &CourseLandingResponse{
		ID:                   c.ID,
		Slug:                 c.Slug,
		Title:                c.Title,
		Language:             c.Language,
		Level:                c.Level,
		ActualPrice:          c.ActualPrice,
		FinalPrice:           c.FinalPrice,
		Benefits:             c.Benefits,
		Requirements:         c.Requirements,
		TotalLectures:        c.TotalLectures,
		TotalDurationSeconds: c.TotalDurationSeconds,
		RatingAvg:            c.RatingAvg,
		FeedbackCount:        c.FeedbackCount,
	}
	if c.ShortDescription.Valid {
		resp.ShortDescription = &c.ShortDescription.String
	}
	if c.LongDescription.Valid {
		resp.LongDescription = &c.LongDescription.String
	}
	if c.ImageURL.Valid {
		resp.ImageURL = &c.ImageURL.String
	}
	if c.PreviewVideoURL.Valid {
		resp.PreviewVideoURL = &c.PreviewVideoURL.String
	}
	if c.CategoryID.Valid {
		resp.Category = m.GetCategoryInfoRepository(c.CategoryID.String)
	}
	if c.SubcategoryID.Valid {
		resp.Subcategory = m.GetSubcategoryInfoRepository(c.SubcategoryID.String)
	}
	if c.TutorID.Valid {
		u, tp, _ := m.GetTutorUserRepository(c.TutorID.String)
		if u != nil {
			resp.Instructor = models.InstructorInfo{ID: u.ID, Name: u.Name, Image: u.Image}
			if tp != nil && tp.Headline != nil {
				resp.Instructor.Headline = tp.Headline
			}
		}
	}
	if userID != "" {
		var exists bool
		m.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND revoked = false)`, userID, c.ID).Scan(&exists)
		resp.IsEnrolled = exists
	}

	// Build chapter+lesson tree using JSON aggregation
	jsonData, err := m.FetchCourseLandingTreeJSON(c.ID)
	if err == nil && jsonData != nil {
		json.Unmarshal(jsonData, &resp.Chapters)
	}
	if resp.Chapters == nil {
		resp.Chapters = []ChapterCardResponse{}
	}
	return resp, nil
}

// ReadStudyService returns the study page data for enrolled users.
func (m *CoursesModule) ReadStudyService(courseID, userID string) (*enrollments.CourseStudyResponse, error) {
	course, cp, completed, err := m.ReadRepository(courseID, userID)
	if err != nil {
		return nil, err
	}

	resp := &enrollments.CourseStudyResponse{}
	resp.Course.ID = course.ID
	resp.Course.Title = course.Title
	if course.ImageURL.Valid {
		resp.Course.Thumbnail = &course.ImageURL.String
	}
	resp.Enrollment.CompletionPercent = cp
	resp.Enrollment.Completed = completed

	jsonData, err := m.FetchCourseTreeJSON(courseID, userID)
	if err == nil && jsonData != nil {
		json.Unmarshal(jsonData, &resp.Chapters)
	}
	if resp.Chapters == nil {
		resp.Chapters = []enrollments.StudyChapterItem{}
	}
	return resp, nil
}

func (m *CoursesModule) EnrolledCoursesService(userID string) ([]EnrolledCourseResponse, error) {
	return m.EnrolledCoursesRepository(userID)
}

func (m *CoursesModule) toCard(c Course) CourseCardResponse {
	card := CourseCardResponse{
		ID:            c.ID,
		Slug:          c.Slug,
		Title:         c.Title,
		ActualPrice:   c.ActualPrice,
		FinalPrice:    c.FinalPrice,
		Benefits:      c.Benefits,
		Level:         c.Level,
		RatingAvg:     c.RatingAvg,
		FeedbackCount: c.FeedbackCount,
	}
	if c.ShortDescription.Valid {
		card.ShortDescription = &c.ShortDescription.String
	}
	if c.ImageURL.Valid {
		card.ImageURL = &c.ImageURL.String
	}
	if c.TutorID.Valid {
		u, _, _ := m.GetTutorUserRepository(c.TutorID.String)
		if u != nil {
			card.Instructor = models.InstructorInfo{ID: u.ID, Name: u.Name, Image: u.Image}
		}
	}
	return card
}
