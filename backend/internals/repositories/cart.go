package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type CartRepository struct{ DB *sql.DB }

func NewCartRepository() *CartRepository { return &CartRepository{DB: database.DB} }

func (r *CartRepository) Add(userID, courseID string) error {
	_, err := r.DB.Exec(`INSERT INTO cart_items (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, courseID)
	return err
}

func (r *CartRepository) Remove(userID, courseID string) error {
	_, err := r.DB.Exec(`DELETE FROM cart_items WHERE user_id = $1 AND course_id = $2`, userID, courseID)
	return err
}

func (r *CartRepository) List(userID string) ([]models.CartItem, error) {
	rows, err := r.DB.Query(`SELECT id, user_id, course_id, added_at FROM cart_items WHERE user_id = $1 ORDER BY added_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.CartItem
	for rows.Next() {
		var ci models.CartItem
		rows.Scan(&ci.ID, &ci.UserID, &ci.CourseID, &ci.AddedAt)
		list = append(list, ci)
	}
	if list == nil {
		list = []models.CartItem{}
	}
	return list, rows.Err()
}

func (r *CartRepository) Clear(userID string) error {
	_, err := r.DB.Exec(`DELETE FROM cart_items WHERE user_id = $1`, userID)
	return err
}
