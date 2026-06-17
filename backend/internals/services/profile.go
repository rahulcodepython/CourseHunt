package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type ProfileService struct{ Repo *repositories.ProfileRepository }

func NewProfileService() *ProfileService { return &ProfileService{Repo: repositories.NewProfileRepository()} }

func (s *ProfileService) GetUser(userID string) (*models.UserProfile, error) { return s.Repo.GetUser(userID) }
func (s *ProfileService) GetTutor(userID string) (*models.TutorProfile, error) { return s.Repo.GetTutor(userID) }
func (s *ProfileService) UpsertUser(userID string, req models.UpdateProfileRequest) (*models.UserProfile, error) { return s.Repo.UpsertUserProfile(userID, req) }
func (s *ProfileService) UpsertTutor(userID string, req models.UpdateProfileRequest) (*models.TutorProfile, error) { return s.Repo.UpsertTutorProfile(userID, req) }
