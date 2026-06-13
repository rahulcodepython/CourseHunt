package services

import (
	"errors"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type CourseService struct {
	Courses *repositories.CourseRepository
}

func NewCourseService() *CourseService {
	return &CourseService{Courses: repositories.NewCourseRepository()}
}

func (s *CourseService) Categories() ([]models.Category, error) {
	return s.Courses.Categories()
}

func (s *CourseService) PublicCourses(limit int) ([]models.CourseSummary, error) {
	return s.Courses.Summaries(true, limit, "", "")
}

func (s *CourseService) AdminCourses(userID string, position string) ([]models.CourseSummary, error) {
	return s.Courses.Summaries(false, 0, userID, position)
}

func (s *CourseService) Course(id int) (*models.CourseDetail, error) {
	return s.Courses.FindByID(id)
}

func (s *CourseService) Create(title string, creatorID string) (*models.CourseDetail, error) {
	if title == "" {
		return nil, errors.New("title is required")
	}
	return s.Courses.CreateDefault(title, creatorID)
}

func (s *CourseService) Update(id int, course *models.CourseDetail) (*models.CourseDetail, error) {
	return s.Courses.Update(id, course)
}

func (s *CourseService) Delete(id int) error {
	return s.Courses.Delete(id)
}
