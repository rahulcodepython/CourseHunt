package certificates

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

var IssueCertificateErrMap = postgres.StatusErrorMap{
	0: generic.ErrCertificateNotEnrolled,
	1: generic.ErrCertificateNotCompleted,
}

const (
	IssueCertificateJSON = `
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
			ON CONFLICT (user_id, course_id) DO UPDATE SET id = certificates.id
			RETURNING id, user_id, course_id, issued_at
		)
		SELECT
			sc.status_code,
			CASE WHEN sc.status_code = 2 THEN
				jsonb_build_object(
					'id', COALESCE(i.id::text, ''),
					'user_id', COALESCE(i.user_id::text, ''),
					'issued_at', COALESCE(i.issued_at, NOW()),
					'course', jsonb_build_object(
						'id', $2,
						'title', COALESCE(co.title, ''),
						'thumbnail', co.image_url
					),
					'tutor', jsonb_build_object(
						'id', COALESCE(tu.id::text, ''),
						'name', COALESCE(tu.name, ''),
						'image', tu.image
					)
				)
			ELSE NULL END AS data_json
		FROM status_check sc
		LEFT JOIN inserted i ON TRUE
		LEFT JOIN courses co ON co.id = $2
		LEFT JOIN "users" tu ON tu.id = co.tutor_id;
	`

	ListCertificatesJSON = `
		SELECT jsonb_build_object(
			'total', COALESCE((SELECT COUNT(*) FROM certificates WHERE user_id = $1), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', cert.id,
						'user_id', cert.user_id,
						'issued_at', cert.issued_at,
						'course', jsonb_build_object(
							'id', cert.course_id,
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						),
						'tutor', jsonb_build_object(
							'id', COALESCE(tu.id::text, ''),
							'name', COALESCE(tu.name, ''),
							'image', tu.image
						)
					) ORDER BY cert.issued_at DESC
				)
				FROM (
					SELECT id, user_id, course_id, issued_at
					FROM certificates
					WHERE user_id = $1
					ORDER BY issued_at DESC
					LIMIT $2 OFFSET $3
				) cert
				LEFT JOIN courses co ON co.id = cert.course_id
				LEFT JOIN "users" tu ON tu.id = co.tutor_id
			), '[]'::jsonb)
		);
	`

	VerifyCertificateJSON = `
		SELECT jsonb_build_object(
			'id', c.id,
			'issued_at', c.issued_at,
			'student', jsonb_build_object('id', su.id, 'name', COALESCE(su.name, ''), 'image', su.image),
			'course', jsonb_build_object('id', co.id, 'title', COALESCE(co.title, ''), 'thumbnail', co.image_url),
			'tutor', jsonb_build_object('id', COALESCE(tu.id::text, ''), 'name', COALESCE(tu.name, ''), 'image', tu.image)
		)
		FROM certificates c
		LEFT JOIN "users" su ON su.id = c.user_id
		LEFT JOIN courses co ON co.id = c.course_id
		LEFT JOIN "users" tu ON tu.id = co.tutor_id
		WHERE c.id = $1;
	`
)
