package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type WishlistService struct{ Repo *repositories.WishlistRepository }

func NewWishlistService() *WishlistService { return &WishlistService{Repo: repositories.NewWishlistRepository()} }

func (s *WishlistService) Add(userID, courseID string) error { return s.Repo.Add(userID, courseID) }
func (s *WishlistService) Remove(userID, courseID string) error { return s.Repo.Remove(userID, courseID) }
func (s *WishlistService) List(userID string) ([]models.Wishlist, error) { return s.Repo.List(userID) }
