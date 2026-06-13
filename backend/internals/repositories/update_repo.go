package repositories

import (
	"database/sql"
	"time"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type UpdateRepository struct {
	DB *sql.DB
}

func NewUpdateRepository() *UpdateRepository {
	return &UpdateRepository{DB: database.DB}
}

func (r *UpdateRepository) Create(title, description string, date time.Time) (*models.RecentUpdate, error) {
	var update models.RecentUpdate
	err := r.DB.QueryRow(`
		INSERT INTO recent_updates (title, description, date)
		VALUES ($1, $2, $3)
		RETURNING id, title, description, date, created_at
	`, title, description, date).Scan(&update.ID, &update.Title, &update.Description, &update.Date, &update.CreatedAt)
	if err != nil {
		return nil, err
	}
	update.LegacyID = update.ID
	return &update, nil
}

func (r *UpdateRepository) All() ([]models.RecentUpdate, error) {
	rows, err := r.DB.Query(`SELECT id, title, description, date, created_at FROM recent_updates ORDER BY date DESC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	updates := []models.RecentUpdate{}
	for rows.Next() {
		var u models.RecentUpdate
		if err := rows.Scan(&u.ID, &u.Title, &u.Description, &u.Date, &u.CreatedAt); err != nil {
			return nil, err
		}
		u.LegacyID = u.ID
		updates = append(updates, u)
	}
	return updates, rows.Err()
}

func (r *UpdateRepository) Update(id int, title, description string, date time.Time) (*models.RecentUpdate, error) {
	var update models.RecentUpdate
	err := r.DB.QueryRow(`
		UPDATE recent_updates
		SET title = $1, description = $2, date = $3
		WHERE id = $4
		RETURNING id, title, description, date, created_at
	`, title, description, date, id).Scan(&update.ID, &update.Title, &update.Description, &update.Date, &update.CreatedAt)
	if err != nil {
		return nil, err
	}
	update.LegacyID = update.ID
	return &update, nil
}

func (r *UpdateRepository) Delete(id int) error {
	_, err := r.DB.Exec(`DELETE FROM recent_updates WHERE id = $1`, id)
	return err
}

func (r *UpdateRepository) UnseenUpdates(userID string) ([]models.RecentUpdate, error) {
	rows, err := r.DB.Query(`
		SELECT id, title, description, date, created_at
		FROM recent_updates
		WHERE id NOT IN (SELECT update_id FROM update_seen_status WHERE user_id = $1)
		ORDER BY date DESC, created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	updates := []models.RecentUpdate{}
	for rows.Next() {
		var u models.RecentUpdate
		if err := rows.Scan(&u.ID, &u.Title, &u.Description, &u.Date, &u.CreatedAt); err != nil {
			return nil, err
		}
		u.LegacyID = u.ID
		updates = append(updates, u)
	}
	return updates, rows.Err()
}

func (r *UpdateRepository) MarkAsSeen(userID string, updateIDs []int) error {
	if len(updateIDs) == 0 {
		return nil
	}
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`INSERT INTO update_seen_status (user_id, update_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, id := range updateIDs {
		if _, err := stmt.Exec(userID, id); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}
