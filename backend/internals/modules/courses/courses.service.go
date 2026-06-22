package courses

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/modules/enrollments"

	"database/sql"
	"fmt"
)

func (m *CoursesModule) CreateService(tutorID string, req CreateCourseRequest) (*CourseCreatedResponse, error) {
	return m.CreateRepository(tutorID, req)
}

func (m *CoursesModule) UpdateService(id string, req UpdateCourseRequest) error {
	return m.UpdateRepository(id, req)
}

func (m *CoursesModule) DeleteService(id string) error {
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
		resp.IsEnrolled = m.Enrollments.IsEnrolledRepository(userID, c.ID)
	}

	// Build chapter+lesson tree
	chaptersList, _ := m.Chapters.ListRepository(c.ID)
	for _, ch := range chaptersList {
		lessonsList, _ := m.Lessons.ListRepository(ch.ID)
		chResp := ChapterCardResponse{
			ID:                   ch.ID,
			ChapterNo:            ch.ChapterNo,
			Title:                ch.Title,
			TotalLectures:        ch.TotalLectures,
			TotalDurationSeconds: ch.TotalDurationSeconds,
		}
		for _, l := range lessonsList {
			lr := LessonCardResponse{
				ID:              l.ID,
				LessonNo:        l.LessonNo,
				Title:           l.Title,
				LessonType:      l.LessonType,
				DurationSeconds: l.DurationSeconds,
			}
			if l.ShortDescription.Valid {
				lr.ShortDescription = &l.ShortDescription.String
			}
			if l.PreviewVideoURL.Valid {
				lr.PreviewVideoURL = &l.PreviewVideoURL.String
			}
			chResp.Lessons = append(chResp.Lessons, lr)
		}
		if chResp.Lessons == nil {
			chResp.Lessons = []LessonCardResponse{}
		}
		resp.Chapters = append(resp.Chapters, chResp)
	}
	if resp.Chapters == nil {
		resp.Chapters = []ChapterCardResponse{}
	}
	return resp, nil
}

// ReadStudyService returns the study page data for enrolled users.
func (m *CoursesModule) ReadStudyService(courseID, userID string) (*enrollments.CourseStudyResponse, error) {
	course, err := m.ReadRepository(courseID)
	if err != nil {
		return nil, err
	}
	enrollment, err := m.Enrollments.ReadRepository(userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("not enrolled")
	}

	resp := &enrollments.CourseStudyResponse{}
	resp.Course.ID = course.ID
	resp.Course.Title = course.Title
	if course.ImageURL.Valid {
		resp.Course.ImageURL = &course.ImageURL.String
	}
	resp.Enrollment.CompletionPercent = enrollment.CompletionPercent
	resp.Enrollment.Completed = enrollment.Completed

	chaptersList, _ := m.Chapters.ListRepository(courseID)
	for _, ch := range chaptersList {
		lessonsList, _ := m.Lessons.ListRepository(ch.ID)
		cp := m.Enrollments.GetChapterProgressRepository(userID, ch.ID)
		chItem := enrollments.StudyChapterItem{
			ID:                   ch.ID,
			ChapterNo:            ch.ChapterNo,
			Title:                ch.Title,
			TotalLectures:        ch.TotalLectures,
			TotalDurationSeconds: ch.TotalDurationSeconds,
		}
		chItem.Progress.LessonsCompleted = cp.LessonsCompleted
		chItem.Progress.Completed = cp.Completed
		for _, l := range lessonsList {
			completed := m.Enrollments.GetLessonProgressRepository(userID, l.ID)
			chItem.Lessons = append(chItem.Lessons, enrollments.StudyLessonItem{
				ID:              l.ID,
				LessonNo:        l.LessonNo,
				Title:           l.Title,
				LessonType:      l.LessonType,
				DurationSeconds: l.DurationSeconds,
				Completed:       completed,
			})
		}
		if chItem.Lessons == nil {
			chItem.Lessons = []enrollments.StudyLessonItem{}
		}
		resp.Chapters = append(resp.Chapters, chItem)
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
