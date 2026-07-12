package certificate

import (
	"errors"
)

var (
	ErrNotEnrolled     = errors.New("access denied: not enrolled in course")
	ErrNotCompleted    = errors.New("course not completed")
	ErrFailedToExecute = errors.New("failed to issue certificate")
)

func (c *CertificateModule) IssueRepository(userID, courseID string) (*Certificate, error) {
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
		Certificate
		StatusCode int `db:"status_code"`
	}

	var res executionResult
	if err := c.DB.Get(&res, query, userID, courseID); err != nil {
		return nil, err
	}

	// Read structural outcome
	switch res.StatusCode {
	case 0:
		return nil, ErrNotEnrolled
	case 1:
		return nil, ErrNotCompleted
	case 2:
		return &res.Certificate, nil
	default:
		return nil, ErrFailedToExecute
	}
}

func (c *CertificateModule) ListRepository(userID string) ([]Certificate, error) {
	// Initialize empty slice to prevent returning 'null' in JSON results
	list := []Certificate{}

	query := `
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
	`

	if err := c.DB.Select(&list, query, userID); err != nil {
		return nil, err
	}

	return list, nil
}
