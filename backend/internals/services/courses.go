package services

import (
	"database/sql"
	"fmt"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type CourseService struct {
	Courses     *repositories.CourseRepository
	Chapters    *repositories.ChapterRepository
	Lessons     *repositories.LessonRepository
	Enrollments *repositories.EnrollmentRepository
}

func NewCourseService() *CourseService {
	return &CourseService{
		Courses:     repositories.NewCourseRepository(),
		Chapters:    repositories.NewChapterRepository(),
		Lessons:     repositories.NewLessonRepository(),
		Enrollments: repositories.NewEnrollmentRepository(),
	}
}

func (s *CourseService) Create(tutorID string, req models.CreateCourseRequest) (*models.CourseCreatedResponse, error) {
	return s.Courses.Create(tutorID, req)
}

func (s *CourseService) Update(id string, req models.UpdateCourseRequest) error {
	return s.Courses.Update(id, req)
}

func (s *CourseService) Delete(id string) error {
	return s.Courses.Delete(id)
}

// List returns a paginated list of courses with enriched card data.
func (s *CourseService) List(page, limit int, categoryID, level, search, tutorID, status string) ([]models.CourseCardResponse, int, error) {
	courses, total, err := s.Courses.List(page, limit, categoryID, level, search, tutorID, status)
	if err != nil {
		return nil, 0, err
	}
	cards := make([]models.CourseCardResponse, 0, len(courses))
	for _, c := range courses {
		card := s.toCard(c)
		cards = append(cards, card)
	}
	return cards, total, nil
}

func (s *CourseService) Landing(slug, userID string) (*models.CourseLandingResponse, error) {
	c, err := s.Courses.FindBySlug(slug)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("not found")
	}
	if err != nil {
		return nil, err
	}

	resp := &models.CourseLandingResponse{
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
		resp.Category = s.Courses.GetCategoryInfo(c.CategoryID.String)
	}
	if c.SubcategoryID.Valid {
		resp.Subcategory = s.Courses.GetSubcategoryInfo(c.SubcategoryID.String)
	}
	if c.TutorID.Valid {
		u, tp, _ := s.Courses.GetTutorUser(c.TutorID.String)
		if u != nil {
			resp.Instructor = models.InstructorInfo{ID: u.ID, Name: u.Name, Image: u.Image}
			if tp != nil && tp.Headline != nil {
				resp.Instructor.Headline = tp.Headline
			}
		}
	}
	if userID != "" {
		resp.IsEnrolled = s.Enrollments.IsEnrolled(userID, c.ID)
	}

	// Build chapter+lesson tree
	chapters, _ := s.Chapters.ListByCourse(c.ID)
	for _, ch := range chapters {
		lessons, _ := s.Lessons.ListByChapter(ch.ID)
		chResp := models.ChapterCardResponse{
			ID:                   ch.ID,
			ChapterNo:            ch.ChapterNo,
			Title:                ch.Title,
			TotalLectures:        ch.TotalLectures,
			TotalDurationSeconds: ch.TotalDurationSeconds,
		}
		for _, l := range lessons {
			lr := models.LessonCardResponse{
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
			chResp.Lessons = []models.LessonCardResponse{}
		}
		resp.Chapters = append(resp.Chapters, chResp)
	}
	if resp.Chapters == nil {
		resp.Chapters = []models.ChapterCardResponse{}
	}
	return resp, nil
}

// Study returns the study page data for enrolled users.
func (s *CourseService) Study(courseID, userID string) (*models.CourseStudyResponse, error) {
	course, err := s.Courses.FindByID(courseID)
	if err != nil {
		return nil, err
	}
	enrollment, err := s.Enrollments.Get(userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("not enrolled")
	}

	resp := &models.CourseStudyResponse{}
	resp.Course.ID = course.ID
	resp.Course.Title = course.Title
	if course.ImageURL.Valid {
		resp.Course.ImageURL = &course.ImageURL.String
	}
	resp.Enrollment.CompletionPercent = enrollment.CompletionPercent
	resp.Enrollment.Completed = enrollment.Completed

	chapters, _ := s.Chapters.ListByCourse(courseID)
	for _, ch := range chapters {
		lessons, _ := s.Lessons.ListByChapter(ch.ID)
		cp := s.Enrollments.GetChapterProgress(userID, ch.ID)
		chItem := models.StudyChapterItem{
			ID:                   ch.ID,
			ChapterNo:            ch.ChapterNo,
			Title:                ch.Title,
			TotalLectures:        ch.TotalLectures,
			TotalDurationSeconds: ch.TotalDurationSeconds,
		}
		chItem.Progress.LessonsCompleted = cp.LessonsCompleted
		chItem.Progress.Completed = cp.Completed
		for _, l := range lessons {
			completed := s.Enrollments.GetLessonProgress(userID, l.ID)
			chItem.Lessons = append(chItem.Lessons, models.StudyLessonItem{
				ID:              l.ID,
				LessonNo:        l.LessonNo,
				Title:           l.Title,
				LessonType:      l.LessonType,
				DurationSeconds: l.DurationSeconds,
				Completed:       completed,
			})
		}
		if chItem.Lessons == nil {
			chItem.Lessons = []models.StudyLessonItem{}
		}
		resp.Chapters = append(resp.Chapters, chItem)
	}
	if resp.Chapters == nil {
		resp.Chapters = []models.StudyChapterItem{}
	}
	return resp, nil
}

func (s *CourseService) EnrolledCourses(userID string) ([]models.EnrolledCourseResponse, error) {
	return s.Courses.EnrolledCourses(userID)
}

func (s *CourseService) toCard(c models.Course) models.CourseCardResponse {
	card := models.CourseCardResponse{
		ID:           c.ID,
		Slug:         c.Slug,
		Title:        c.Title,
		ActualPrice:  c.ActualPrice,
		FinalPrice:   c.FinalPrice,
		Benefits:     c.Benefits,
		Level:        c.Level,
		RatingAvg:    c.RatingAvg,
		FeedbackCount: c.FeedbackCount,
	}
	if c.ShortDescription.Valid {
		card.ShortDescription = &c.ShortDescription.String
	}
	if c.ImageURL.Valid {
		card.ImageURL = &c.ImageURL.String
	}
	if c.TutorID.Valid {
		u, _, _ := s.Courses.GetTutorUser(c.TutorID.String)
		if u != nil {
			card.Instructor = models.InstructorInfo{ID: u.ID, Name: u.Name, Image: u.Image}
		}
	}
	return card
}
