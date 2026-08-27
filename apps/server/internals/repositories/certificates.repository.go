package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"
	"time"

	"github.com/jmoiron/sqlx"
)

type CertificatesRepository struct {
	DB              *sqlx.DB
	EnrollmentsRepo *EnrollmentsRepository
}

func NewCertificatesRepository(db *sqlx.DB, enrollmentsRepo *EnrollmentsRepository) *CertificatesRepository {
	return &CertificatesRepository{DB: db, EnrollmentsRepo: enrollmentsRepo}
}

func (r *CertificatesRepository) IssueRepository(userID, courseID string) (*entities.Certificate, error) {
	query := `
		WITH status_check AS (
			SELECT
				CASE
					WHEN COUNT(*) = 0 THEN 0
					WHEN SUM(CASE WHEN completed THEN 1 ELSE 0 END) = 0 THEN 1
					ELSE 2
				END as status_code
			FROM enrollments
			WHERE user_id = $1 AND course_id = $2 AND revoked = false
		),
		inserted AS (
			INSERT INTO certificates (user_id, course_id)
			SELECT $1, $2
			FROM status_check
			WHERE status_check.status_code = 2
			ON CONFLICT (user_id, course_id) DO UPDATE SET id = certificates.id -- Ensure it stays idempotent
			RETURNING id, user_id, course_id, issued_at
		)
		SELECT
			COALESCE(i.id::text, '') AS id,
			COALESCE(i.user_id::text, '') AS user_id,
			COALESCE(i.issued_at, NOW()) AS issued_at,
			$2 AS course_id,
			COALESCE(co.title, '') AS course_title,
			co.image_url AS course_thumbnail,
			COALESCE(tu.id::text, '') AS tutor_id,
			COALESCE(tu.name, '') AS tutor_name,
			tu.image AS tutor_image,
			sc.status_code
		FROM status_check sc
		LEFT JOIN inserted i ON TRUE
		LEFT JOIN courses co ON co.id = $2
		LEFT JOIN "users" tu ON tu.id = co.tutor_id;
	`

	type flatResult struct {
		ID          string    `db:"id"`
		UserID      string    `db:"user_id"`
		CourseID    string    `db:"course_id"`
		CourseTitle string    `db:"course_title"`
		CourseThumb *string   `db:"course_thumbnail"`
		TutorID     string    `db:"tutor_id"`
		TutorName   string    `db:"tutor_name"`
		TutorImage  *string   `db:"tutor_image"`
		IssuedAt    time.Time `db:"issued_at"`
		StatusCode  int       `db:"status_code"`
	}

	var res flatResult
	if err := r.DB.Get(&res, query, userID, courseID); err != nil {
		return nil, err
	}

	switch res.StatusCode {
	case 0:
		return nil, generic.ErrCertificateNotEnrolled
	case 1:
		return nil, generic.ErrCertificateNotCompleted
	case 2:
		return &entities.Certificate{
			ID:     res.ID,
			UserID: res.UserID,
			Course: generic.CourseInfo{
				ID:        res.CourseID,
				Title:     res.CourseTitle,
				Thumbnail: res.CourseThumb,
			},
			Tutor: generic.InstructorInfo{
				ID:    res.TutorID,
				Name:  res.TutorName,
				Image: res.TutorImage,
			},
			IssuedAt: res.IssuedAt,
		}, nil
	default:
		return nil, generic.ErrCertificateFailedToExecute
	}
}

func (r *CertificatesRepository) ListRepository(userID string, page, limit int) ([]entities.Certificate, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total_count"`
		Data  json.RawMessage `db:"data_json"`
	}
	err := r.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total_count FROM certificates WHERE user_id = $1
		),
		data_cte AS (
			SELECT
				cert.id AS id,
				cert.user_id AS user_id,
				cert.issued_at AS issued_at,
				json_build_object(
					'id', cert.course_id,
					'title', COALESCE(co.title, ''),
					'thumbnail', co.image_url
				) AS course,
				json_build_object(
					'id', COALESCE(tu.id::text, ''),
					'name', COALESCE(tu.name, ''),
					'image', tu.image
				) AS tutor
			FROM certificates cert
			LEFT JOIN courses co ON co.id = cert.course_id
			LEFT JOIN "users" tu ON tu.id = co.tutor_id
			WHERE cert.user_id = $1
			ORDER BY cert.issued_at DESC
			LIMIT $2 OFFSET $3
		)
		SELECT
			COALESCE((SELECT total_count FROM count_cte), 0) AS total_count,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data_json
	`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []entities.Certificate
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}

// VerifyRepository is the public, unauthenticated lookup used by a
// certificate's QR code — returns Valid=false (no other fields populated)
// for an id that doesn't exist, rather than an error, so the verification
// page can render a clean "not legit" state.
func (r *CertificatesRepository) VerifyRepository(id string) (*entities.CertificateVerification, error) {
	var result struct {
		Exists bool             `db:"cert_exists"`
		Data   *json.RawMessage `db:"data_json"`
	}
	err := r.DB.Get(&result, `
		WITH cert AS (
			SELECT c.id, c.user_id, c.course_id, c.issued_at
			FROM certificates c
			WHERE c.id = $1
		)
		SELECT
			EXISTS(SELECT 1 FROM cert) AS cert_exists,
			(
				SELECT json_build_object(
					'id', cert.id,
					'issued_at', cert.issued_at,
					'student', json_build_object('id', su.id, 'name', COALESCE(su.name, ''), 'image', su.image),
					'course', json_build_object('id', co.id, 'title', COALESCE(co.title, ''), 'thumbnail', co.image_url),
					'tutor', json_build_object('id', COALESCE(tu.id::text, ''), 'name', COALESCE(tu.name, ''), 'image', tu.image)
				)
				FROM cert
				LEFT JOIN "users" su ON su.id = cert.user_id
				LEFT JOIN courses co ON co.id = cert.course_id
				LEFT JOIN "users" tu ON tu.id = co.tutor_id
			) AS data_json
	`, id)
	if err != nil {
		return nil, err
	}

	if !result.Exists || result.Data == nil {
		return &entities.CertificateVerification{Valid: false}, nil
	}

	var verification entities.CertificateVerification
	if err := json.Unmarshal(*result.Data, &verification); err != nil {
		return nil, err
	}
	verification.Valid = true
	return &verification, nil
}
