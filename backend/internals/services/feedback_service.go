package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type FeedbackService struct {
	Feedbacks *repositories.FeedbackRepository
	Users     *repositories.UserRepository
	Courses   *repositories.CourseRepository
}

func NewFeedbackService() *FeedbackService {
	return &FeedbackService{
		Feedbacks: repositories.NewFeedbackRepository(),
		Users:     repositories.NewUserRepository(),
		Courses:   repositories.NewCourseRepository(),
	}
}

func (s *FeedbackService) List(userID string, filterByCreator bool) ([]models.Feedback, error) {
	return s.Feedbacks.List(userID, filterByCreator)
}

func (s *FeedbackService) Create(userID string, courseID int, message string, rating int) error {
	user, err := s.Users.FindByID(userID)
	if err != nil {
		return err
	}
	course, err := s.Courses.FindByID(courseID)
	if err != nil {
		return err
	}
	return s.Feedbacks.Create(user, course, message, rating)
}

func (s *FeedbackService) SetPinned(id int, pinned bool) error {
	return s.Feedbacks.SetPinned(id, pinned)
}

func (s *FeedbackService) Delete(id int) error {
	return s.Feedbacks.Delete(id)
}
