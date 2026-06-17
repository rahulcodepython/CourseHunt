package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type NoteService struct{ Repo *repositories.NoteRepository }

func NewNoteService() *NoteService { return &NoteService{Repo: repositories.NewNoteRepository()} }

func (s *NoteService) Upsert(userID, lessonID, courseID, content string) (*models.NoteResponse, error) {
	return s.Repo.Upsert(userID, lessonID, courseID, content)
}
func (s *NoteService) Get(userID, lessonID string) (*models.UserNote, error) {
	return s.Repo.Get(userID, lessonID)
}
