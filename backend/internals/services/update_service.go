package services

import (
	"time"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type UpdateService struct {
	Repo *repositories.UpdateRepository
}

func NewUpdateService() *UpdateService {
	return &UpdateService{Repo: repositories.NewUpdateRepository()}
}

func (s *UpdateService) Create(title, description string, date time.Time) (*models.RecentUpdate, error) {
	return s.Repo.Create(title, description, date)
}

func (s *UpdateService) All() ([]models.RecentUpdate, error) {
	return s.Repo.All()
}

func (s *UpdateService) Update(id int, title, description string, date time.Time) (*models.RecentUpdate, error) {
	return s.Repo.Update(id, title, description, date)
}

func (s *UpdateService) Delete(id int) error {
	return s.Repo.Delete(id)
}

func (s *UpdateService) GetUnseenAndMarkSeen(userID string) ([]models.RecentUpdate, error) {
	updates, err := s.Repo.UnseenUpdates(userID)
	if err != nil {
		return nil, err
	}

	if len(updates) > 0 {
		ids := make([]int, len(updates))
		for i, u := range updates {
			ids[i] = u.ID
		}
		// Fire and forget seen marking, or do it synchronously as per requirement
		// "along with this api call before returning the response marks all of those updates as the user has seen."
		if err := s.Repo.MarkAsSeen(userID, ids); err != nil {
			return nil, err
		}
	}

	return updates, nil
}
