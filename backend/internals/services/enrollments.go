package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type EnrollmentService struct{ Repo *repositories.EnrollmentRepository }

func NewEnrollmentService() *EnrollmentService {
	return &EnrollmentService{Repo: repositories.NewEnrollmentRepository()}
}

func (s *EnrollmentService) ManualEnroll(userID, courseID string) error {
	return s.Repo.Enroll(userID, courseID)
}

func (s *EnrollmentService) List(page, limit int) ([]models.Enrollment, int, error) {
	return s.Repo.ListByAdmin(page, limit)
}
