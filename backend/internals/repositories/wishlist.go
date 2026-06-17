package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type WishlistRepository struct{ DB *sql.DB }

func NewWishlistRepository() *WishlistRepository { return &WishlistRepository{DB: database.DB} }

func (r *WishlistRepository) Add(userID, courseID string) error {
	_, err := r.DB.Exec(`INSERT INTO wishlists (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, courseID)
	return err
}

func (r *WishlistRepository) Remove(userID, courseID string) error {
	_, err := r.DB.Exec(`DELETE FROM wishlists WHERE user_id = $1 AND course_id = $2`, userID, courseID)
	return err
}

func (r *WishlistRepository) List(userID string) ([]models.Wishlist, error) {
	rows, err := r.DB.Query(`SELECT id, user_id, course_id, added_at FROM wishlists WHERE user_id = $1 ORDER BY added_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.Wishlist
	for rows.Next() {
		var w models.Wishlist
		rows.Scan(&w.ID, &w.UserID, &w.CourseID, &w.AddedAt)
		list = append(list, w)
	}
	if list == nil {
		list = []models.Wishlist{}
	}
	return list, rows.Err()
}
