package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"

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
			COALESCE(i.id, '') AS id,
			COALESCE(i.user_id, '') AS user_id,
			COALESCE(i.issued_at, NOW()) AS issued_at,
			$2 AS "course.id",
			COALESCE(co.title, '') AS "course.title",
			co.image_url AS "course.thumbnail",
			sc.status_code
		FROM status_check sc
		LEFT JOIN inserted i ON TRUE
		LEFT JOIN courses co ON co.id = $2;
	`

	type executionResult struct {
		entities.Certificate
		StatusCode int `db:"status_code"`
	}

	var res executionResult
	if err := r.DB.Get(&res, query, userID, courseID); err != nil {
		return nil, err
	}

	// Read structural outcome
	switch res.StatusCode {
	case 0:
		return nil, generic.ErrCertificateNotEnrolled
	case 1:
		return nil, generic.ErrCertificateNotCompleted
	case 2:
		return &res.Certificate, nil
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
				cert.course_id AS "course.id",
				COALESCE(co.title, '') AS "course.title",
				co.image_url AS "course.thumbnail"
			FROM certificates cert
			LEFT JOIN courses co ON co.id = cert.course_id
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
