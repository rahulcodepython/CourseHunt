package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type UserRepository struct {
	DB *sql.DB
}

func NewUserRepository() *UserRepository {
	return &UserRepository{DB: database.DB}
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	row := r.DB.QueryRow(`
		SELECT u.id, u.name, COALESCE(p.first_name,''), COALESCE(p.last_name,''), u.email, COALESCE(u.image,''),
			COALESCE(u.role,'student'), COALESCE(p.phone,''), COALESCE(p.address,''), COALESCE(p.city,''),
			COALESCE(p.country,''), COALESCE(p.zip,''), COALESCE(u.banned,false),
			COALESCE(p.purchased_courses,0), COALESCE(p.completed_courses,0), u."createdAt", u."updatedAt"
		FROM "user" u
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE u.email = $1
	`, email)

	var user models.User
	err := row.Scan(&user.ID, &user.Name, &user.FirstName, &user.LastName, &user.Email, &user.Image, &user.Position, &user.Phone, &user.Address, &user.City, &user.Country, &user.Zip, &user.Banned, &user.PurchasedCourses, &user.CompletedCourses, &user.CreatedAt, &user.UpdatedAt)
	user.LegacyID = user.ID
	return &user, err
}

func (r *UserRepository) FindByID(id string) (*models.User, error) {
	row := r.DB.QueryRow(`
		SELECT u.id, u.name, COALESCE(p.first_name,''), COALESCE(p.last_name,''), u.email, COALESCE(u.image,''),
			COALESCE(u.role,'student'), COALESCE(p.phone,''), COALESCE(p.address,''), COALESCE(p.city,''),
			COALESCE(p.country,''), COALESCE(p.zip,''), COALESCE(u.banned,false),
			COALESCE(p.purchased_courses,0), COALESCE(p.completed_courses,0), u."createdAt", u."updatedAt"
		FROM "user" u
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE u.id = $1
	`, id)

	var user models.User
	err := row.Scan(&user.ID, &user.Name, &user.FirstName, &user.LastName, &user.Email, &user.Image, &user.Position, &user.Phone, &user.Address, &user.City, &user.Country, &user.Zip, &user.Banned, &user.PurchasedCourses, &user.CompletedCourses, &user.CreatedAt, &user.UpdatedAt)
	user.LegacyID = user.ID
	return &user, err
}

func (r *UserRepository) List() ([]models.User, error) {
	rows, err := r.DB.Query(`
		SELECT u.id, u.name, COALESCE(p.first_name,''), COALESCE(p.last_name,''), u.email, COALESCE(u.image,''),
			COALESCE(u.role,'student'), COALESCE(p.phone,''), COALESCE(p.address,''), COALESCE(p.city,''),
			COALESCE(p.country,''), COALESCE(p.zip,''), COALESCE(u.banned,false),
			COALESCE(p.purchased_courses,0), COALESCE(p.completed_courses,0), u."createdAt", u."updatedAt"
		FROM "user" u
		LEFT JOIN profiles p ON u.id = p.user_id
		ORDER BY u."createdAt" DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.Name, &user.FirstName, &user.LastName, &user.Email, &user.Image, &user.Position, &user.Phone, &user.Address, &user.City, &user.Country, &user.Zip, &user.Banned, &user.PurchasedCourses, &user.CompletedCourses, &user.CreatedAt, &user.UpdatedAt); err != nil {
			return nil, err
		}
		user.LegacyID = user.ID
		users = append(users, user)
	}
	return users, rows.Err()
}

func (r *UserRepository) UpdateByID(id string, user *models.User) (*models.User, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if user.Name == "" {
		user.Name = (user.FirstName + " " + user.LastName)
	}

	_, err = tx.Exec(`
		UPDATE "user"
		SET name = $1, email = $2, image = $3, "updatedAt" = CURRENT_TIMESTAMP
		WHERE id = $4
	`, user.Name, user.Email, user.Image, id)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(`
		UPDATE profiles
		SET first_name = $1, last_name = $2, phone = $3, address = $4,
			city = $5, country = $6, zip = $7, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $8
	`, user.FirstName, user.LastName, user.Phone, user.Address, user.City, user.Country, user.Zip, id)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return r.FindByID(id)
}

func (r *UserRepository) SetBanStatus(id string, banned bool) error {
	_, err := r.DB.Exec(`UPDATE "user" SET banned = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`, banned, id)
	return err
}

func (r *UserRepository) SetRole(id string, role string) error {
	_, err := r.DB.Exec(`UPDATE "user" SET role = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`, role, id)
	return err
}
