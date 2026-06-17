package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type DashboardService struct{ Repo *repositories.DashboardRepository }

func NewDashboardService() *DashboardService { return &DashboardService{Repo: repositories.NewDashboardRepository()} }

func (s *DashboardService) User(userID string) (*models.UserDashboard, error) { return s.Repo.UserDashboard(userID) }
func (s *DashboardService) Tutor(tutorID string) (*models.TutorDashboard, error) { return s.Repo.TutorDashboard(tutorID) }
func (s *DashboardService) Admin() (*models.AdminDashboard, error) { return s.Repo.AdminDashboard() }
