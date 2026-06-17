package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type UserService struct{ Repo *repositories.UserRepository }

func NewUserService() *UserService { return &UserService{Repo: repositories.NewUserRepository()} }

func (s *UserService) FindByID(id string) (*models.User, error) { return s.Repo.FindByID(id) }
func (s *UserService) List(page, limit int, search, role string) ([]models.UserListItem, int, error) { return s.Repo.List(page, limit, search, role) }
func (s *UserService) AssignRole(userID string, roleID int) error { return s.Repo.AssignRole(userID, roleID) }
func (s *UserService) RevokeRole(userID string, roleID int) error { return s.Repo.RevokeRole(userID, roleID) }
