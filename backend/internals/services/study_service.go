package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type StudyService struct {
	Study   *repositories.StudyRepository
	Users   *repositories.UserRepository
	Courses *repositories.CourseRepository
}

func NewStudyService() *StudyService {
	return &StudyService{
		Study:   repositories.NewStudyRepository(),
		Users:   repositories.NewUserRepository(),
		Courses: repositories.NewCourseRepository(),
	}
}

func (s *StudyService) StudyData(userID string, courseID int) (*models.CourseProgress, error) {
	course, err := s.Courses.FindByID(courseID)
	if err != nil {
		return nil, err
	}
	recordID, completed, lastViewed, err := s.Study.Record(userID, courseID)
	if err != nil {
		return nil, err
	}
	viewed, err := s.Study.ViewedLessons(recordID)
	if err != nil {
		return nil, err
	}
	return &models.CourseProgress{
		ID:               course.ID,
		Title:            course.Title,
		TotalLessons:     course.LessonsCount,
		CompletedLessons: completed,
		Completed:        course.LessonsCount > 0 && completed >= course.LessonsCount,
		LastViewedLessonID: lastViewed,
		ViewedLessons:    viewed,
		Chapters:         course.Chapters,
		Resources:        course.Resources,
	}, nil
}

func (s *StudyService) MarkLessonRead(userID string, courseID int, chapterID int, lessonID int) (bool, error) {
	return s.Study.MarkLessonRead(userID, courseID, chapterID, lessonID)
}

func (s *StudyService) SetLastViewed(userID string, courseID int, lessonID int) error {
	return s.Study.SetLastViewed(userID, courseID, lessonID)
}

func (s *StudyService) UserCourses(userID string, namesOnly bool) ([]models.UserCourse, error) {
	return s.Study.UserCourses(userID, namesOnly)
}
