package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type CategoryRepository struct{ DB *sql.DB }

func NewCategoryRepository() *CategoryRepository { return &CategoryRepository{DB: database.DB} }

func (r *CategoryRepository) List() ([]models.CategoryWithSubs, error) {
	rows, err := r.DB.Query(`SELECT id, name, created_at FROM categories ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cats []models.CategoryWithSubs
	for rows.Next() {
		var c models.CategoryWithSubs
		if err := rows.Scan(&c.ID, &c.Name, &c.CreatedAt); err != nil {
			return nil, err
		}
		subs, _ := r.subcategories(c.ID)
		c.Subcategories = subs
		cats = append(cats, c)
	}
	if cats == nil {
		cats = []models.CategoryWithSubs{}
	}
	return cats, rows.Err()
}

func (r *CategoryRepository) subcategories(catID string) ([]models.Subcategory, error) {
	rows, err := r.DB.Query(`SELECT id, category_id, name, created_at FROM subcategories WHERE category_id = $1 ORDER BY name`, catID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var subs []models.Subcategory
	for rows.Next() {
		var s models.Subcategory
		rows.Scan(&s.ID, &s.CategoryID, &s.Name, &s.CreatedAt)
		subs = append(subs, s)
	}
	if subs == nil {
		subs = []models.Subcategory{}
	}
	return subs, rows.Err()
}

func (r *CategoryRepository) Create(name string) (*models.Category, error) {
	var c models.Category
	err := r.DB.QueryRow(`INSERT INTO categories (name) VALUES ($1) RETURNING id, name, created_at`, name).
		Scan(&c.ID, &c.Name, &c.CreatedAt)
	return &c, err
}

func (r *CategoryRepository) CreateSub(catID, name string) (*models.Subcategory, error) {
	var s models.Subcategory
	err := r.DB.QueryRow(`INSERT INTO subcategories (category_id, name) VALUES ($1, $2) RETURNING id, category_id, name, created_at`, catID, name).
		Scan(&s.ID, &s.CategoryID, &s.Name, &s.CreatedAt)
	return &s, err
}

func (r *CategoryRepository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM categories WHERE id = $1`, id)
	return err
}

func (r *CategoryRepository) DeleteSub(id string) error {
	_, err := r.DB.Exec(`DELETE FROM subcategories WHERE id = $1`, id)
	return err
}
