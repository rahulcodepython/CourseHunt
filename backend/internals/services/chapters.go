package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type ChapterService struct{ Repo *repositories.ChapterRepository }

func NewChapterService() *ChapterService { return &ChapterService{Repo: repositories.NewChapterRepository()} }

func (s *ChapterService) List(courseID string) ([]models.Chapter, error) { return s.Repo.ListByCourse(courseID) }

func (s *ChapterService) Create(courseID string, req models.CreateChapterRequest) (*models.Chapter, error) {
	return s.Repo.Create(courseID, req)
}

func (s *ChapterService) Update(id string, req models.UpdateChapterRequest) (*models.Chapter, error) {
	return s.Repo.Update(id, req)
}

func (s *ChapterService) Delete(id string) error { return s.Repo.Delete(id) }

func (s *ChapterService) GetCourseID(chapterID string) (string, error) {
	return s.Repo.GetCourseIDByChapter(chapterID)
}
