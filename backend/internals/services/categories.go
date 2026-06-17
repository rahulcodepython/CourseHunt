package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type CategoryService struct{ Repo *repositories.CategoryRepository }

func NewCategoryService() *CategoryService { return &CategoryService{Repo: repositories.NewCategoryRepository()} }

func (s *CategoryService) List() ([]models.CategoryWithSubs, error) { return s.Repo.List() }

func (s *CategoryService) Create(req models.CreateCategoryRequest) (*models.Category, error) {
	return s.Repo.Create(req.Name)
}

func (s *CategoryService) CreateSub(catID string, req models.CreateSubcategoryRequest) (*models.Subcategory, error) {
	return s.Repo.CreateSub(catID, req.Name)
}

func (s *CategoryService) Delete(id string) error   { return s.Repo.Delete(id) }
func (s *CategoryService) DeleteSub(id string) error { return s.Repo.DeleteSub(id) }
