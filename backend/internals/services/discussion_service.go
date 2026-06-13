package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type DiscussionService struct {
	Repo *repositories.DiscussionRepository
}

func NewDiscussionService() *DiscussionService {
	return &DiscussionService{Repo: repositories.NewDiscussionRepository()}
}

func (s *DiscussionService) ListByLesson(lessonID int) ([]models.Discussion, error) {
	return s.Repo.ListByLesson(lessonID)
}

func (s *DiscussionService) Create(lessonID int, userID string, message string, parentID *int) (*models.Discussion, error) {
	return s.Repo.Create(lessonID, userID, message, parentID)
}

func (s *DiscussionService) Delete(id int) error {
	return s.Repo.Delete(id)
}
