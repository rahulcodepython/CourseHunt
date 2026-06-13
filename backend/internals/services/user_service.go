package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type UserService struct {
	Users *repositories.UserRepository
}

func NewUserService() *UserService {
	return &UserService{Users: repositories.NewUserRepository()}
}

func (s *UserService) Current(userID string) (*models.User, error) {
	return s.Users.FindByID(userID)
}

func (s *UserService) List() ([]models.User, error) {
	return s.Users.List()
}

func (s *UserService) Update(userID string, user *models.User) (*models.User, error) {
	return s.Users.UpdateByID(userID, user)
}

func (s *UserService) Ban(id string) error {
	return s.Users.SetBanStatus(id, true)
}

func (s *UserService) Unban(id string) error {
	return s.Users.SetBanStatus(id, false)
}

func (s *UserService) SwitchRole(id string, role string) error {
	return s.Users.SetRole(id, role)
}
