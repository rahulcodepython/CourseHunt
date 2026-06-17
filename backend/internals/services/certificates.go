package services

import (
	"fmt"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type CertificateService struct {
	Repo        *repositories.CertificateRepository
	Enrollments *repositories.EnrollmentRepository
}

func NewCertificateService() *CertificateService {
	return &CertificateService{
		Repo:        repositories.NewCertificateRepository(),
		Enrollments: repositories.NewEnrollmentRepository(),
	}
}

func (s *CertificateService) Claim(userID, courseID string) (*models.Certificate, error) {
	e, err := s.Enrollments.Get(userID, courseID)
	if err != nil || !e.Completed {
		return nil, fmt.Errorf("course not completed")
	}
	return s.Repo.Issue(userID, courseID)
}

func (s *CertificateService) List(userID string) ([]models.CertificateResponse, error) { return s.Repo.List(userID) }
func (s *CertificateService) Get(userID, courseID string) (*models.Certificate, error) { return s.Repo.Get(userID, courseID) }
