package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type FeedbackService struct{ Repo *repositories.FeedbackRepository }

func NewFeedbackService() *FeedbackService { return &FeedbackService{Repo: repositories.NewFeedbackRepository()} }

func (s *FeedbackService) Create(userID, courseID string, req models.CreateFeedbackRequest) (*models.Feedback, error) { return s.Repo.Create(userID, courseID, req) }
func (s *FeedbackService) List(courseID string, page, limit int) ([]models.FeedbackResponse, int, error) { return s.Repo.List(courseID, page, limit) }
func (s *FeedbackService) Pin(id string, pin bool) error { return s.Repo.Pin(id, pin) }
func (s *FeedbackService) Delete(id string) error { return s.Repo.Delete(id) }
