package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type CertificateRepository struct{ DB *sql.DB }

func NewCertificateRepository() *CertificateRepository { return &CertificateRepository{DB: database.DB} }

func (r *CertificateRepository) Issue(userID, courseID string) (*models.Certificate, error) {
	var c models.Certificate
	err := r.DB.QueryRow(`
		INSERT INTO certificates (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO UPDATE SET issued_at = certificates.issued_at
		RETURNING id, user_id, course_id, issued_at`,
		userID, courseID,
	).Scan(&c.ID, &c.UserID, &c.CourseID, &c.IssuedAt)
	return &c, err
}

func (r *CertificateRepository) List(userID string) ([]models.CertificateResponse, error) {
	rows, err := r.DB.Query(`
		SELECT cert.id, cert.user_id, cert.course_id, c.title, cert.issued_at
		FROM certificates cert
		JOIN courses c ON c.id = cert.course_id
		WHERE cert.user_id = $1
		ORDER BY cert.issued_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.CertificateResponse
	for rows.Next() {
		var cr models.CertificateResponse
		rows.Scan(&cr.ID, &cr.UserID, &cr.CourseID, &cr.CourseTitle, &cr.IssuedAt)
		list = append(list, cr)
	}
	if list == nil {
		list = []models.CertificateResponse{}
	}
	return list, rows.Err()
}

func (r *CertificateRepository) Get(userID, courseID string) (*models.Certificate, error) {
	var c models.Certificate
	err := r.DB.QueryRow(`SELECT id, user_id, course_id, issued_at FROM certificates WHERE user_id = $1 AND course_id = $2`, userID, courseID).
		Scan(&c.ID, &c.UserID, &c.CourseID, &c.IssuedAt)
	return &c, err
}
