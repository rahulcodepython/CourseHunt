package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type UpdateService struct{ Repo *repositories.UpdateRepository }

func NewUpdateService() *UpdateService { return &UpdateService{Repo: repositories.NewUpdateRepository()} }

func (s *UpdateService) Create(createdBy string, req models.CreateUpdateRequest) (*models.CourseUpdate, error) { return s.Repo.Create(createdBy, req) }
func (s *UpdateService) Update(id, message string) (*models.CourseUpdate, error) { return s.Repo.Update(id, message) }
func (s *UpdateService) Delete(id string) error { return s.Repo.Delete(id) }
func (s *UpdateService) GetFeed(userID string, page, limit int) (*models.UpdateFeedResponse, error) { return s.Repo.GetFeed(userID, page, limit) }
func (s *UpdateService) List(page, limit int) ([]models.CourseUpdate, int, error) { return s.Repo.List(page, limit) }
