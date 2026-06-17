package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type DiscussionService struct{ Repo *repositories.DiscussionRepository }

func NewDiscussionService() *DiscussionService { return &DiscussionService{Repo: repositories.NewDiscussionRepository()} }

func (s *DiscussionService) ListByLesson(lessonID string, page, limit int) ([]models.DiscussionResponse, int, error) {
	return s.Repo.ListByLesson(lessonID, page, limit)
}
func (s *DiscussionService) ListReplies(parentID string, page, limit int) ([]models.DiscussionResponse, int, error) {
	return s.Repo.ListReplies(parentID, page, limit)
}
func (s *DiscussionService) Create(userID, lessonID, courseID string, req models.CreateDiscussionRequest) (*models.Discussion, error) {
	return s.Repo.Create(userID, lessonID, courseID, req)
}
func (s *DiscussionService) Delete(id, userID string, isAdmin bool) error {
	return s.Repo.Delete(id, userID, isAdmin)
}
