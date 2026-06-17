package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type CartService struct{ Repo *repositories.CartRepository }

func NewCartService() *CartService { return &CartService{Repo: repositories.NewCartRepository()} }

func (s *CartService) Add(userID, courseID string) error { return s.Repo.Add(userID, courseID) }
func (s *CartService) Remove(userID, courseID string) error { return s.Repo.Remove(userID, courseID) }
func (s *CartService) List(userID string) ([]models.CartItem, error) { return s.Repo.List(userID) }
func (s *CartService) Clear(userID string) error { return s.Repo.Clear(userID) }
