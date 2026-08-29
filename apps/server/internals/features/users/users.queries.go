package users

import "fmt"

const (
	GetRolesAndPermissions = `
		SELECT
			COALESCE(u.role, '') AS role,
			COALESCE(
				(SELECT jsonb_agg(DISTINCT r.name)
				 FROM roles_user ru
				 JOIN roles r ON r.id = ru.role_id
				 WHERE ru.user_id = $1), '[]'::jsonb
			) AS roles,
			COALESCE(
				(SELECT jsonb_agg(DISTINCT p.id)
				 FROM roles_user ru
				 JOIN role_permissions rp ON rp.role_id = ru.role_id
				 JOIN permissions p ON p.id = rp.permission_id
				 WHERE ru.user_id = $1), '[]'::jsonb
			) AS permissions,
			COALESCE(u.banned, false) AS banned
		FROM "users" u
		WHERE u.id = $1;
	`

	AssignRole = `
		INSERT INTO roles_user (user_id, role_id)
		SELECT $1, unnest($2::uuid[])
		ON CONFLICT DO NOTHING;
	`

	DeleteRole = `DELETE FROM roles_user WHERE user_id = $1 AND role_id = ANY($2::uuid[]);`

	ReadProfile = `SELECT row_to_json(profiles.*) FROM profiles WHERE user_id = $1;`

	UpsertProfile = `
		WITH auth AS (
			SELECT "emailVerified" FROM "users" WHERE id = $1
		),
		inserted AS (
			INSERT INTO profiles (user_id, headline, bio, website, updated_at)
			SELECT $1, $2, $3, $4, CURRENT_TIMESTAMP
			FROM auth a
			WHERE a."emailVerified" = true
			ON CONFLICT (user_id) DO UPDATE SET headline = $2, bio = $3, website = $4, updated_at = CURRENT_TIMESTAMP
			RETURNING id, user_id, headline, bio, website, total_students, rating_avg, created_at, updated_at
		)
		SELECT
			COALESCE((SELECT "emailVerified" FROM auth), false) AS email_verified,
			(SELECT row_to_json(inserted.*) FROM inserted) AS inserted_data;
	`

	AdminListProfiles = `
		SELECT jsonb_build_object(
			'total', COALESCE((SELECT COUNT(*) FROM "users" u), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'user_id', u.id,
						'email', u.email,
						'name', COALESCE(u.name, ''),
						'role', COALESCE(r.name, ''),
						'id', COALESCE(p.id::text, ''),
						'headline', p.headline,
						'bio', p.bio,
						'website', p.website,
						'total_students', p.total_students,
						'rating_avg', p.rating_avg,
						'updated_at', COALESCE(p.updated_at, u."updatedAt", CURRENT_TIMESTAMP)
					)
				)
				FROM (
					SELECT * FROM "users" u
					ORDER BY u."createdAt" DESC
					LIMIT $1 OFFSET $2
				) u
				LEFT JOIN profiles p ON p.user_id = u.id
				LEFT JOIN roles_user ur ON ur.user_id = u.id
				LEFT JOIN roles r ON r.id = ur.role_id
			), '[]'::jsonb)
		);
	`

	UserRoleFilterTemplate = "(u.role = $%d OR EXISTS (SELECT 1 FROM roles_user ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = $%d))"
)

func BuildListUsersQuery(whereClause string) string {
	return fmt.Sprintf(`
		SELECT jsonb_build_object(
			'total', COALESCE((
				SELECT COUNT(*)
				FROM "users" u
				%s
			), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', u.id,
						'name', u.name,
						'email', u.email,
						'image', u.image,
						'role', u.role,
						'email_verified', u."emailVerified",
						'banned', u.banned,
						'created_at', u."createdAt",
						'updated_at', u."updatedAt",
						'roles', COALESCE(ura.roles, '[]'::jsonb)
					) ORDER BY u."createdAt" DESC
				)
				FROM (
					SELECT * FROM "users" u
					%s
					ORDER BY u."createdAt" DESC
					LIMIT $1 OFFSET $2
				) u
				LEFT JOIN (
					SELECT ur.user_id,
						   jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name) ORDER BY r.name) AS roles
					FROM roles_user ur
					JOIN roles r ON r.id = ur.role_id
					GROUP BY ur.user_id
				) ura ON ura.user_id = u.id
			), '[]'::jsonb)
		);
	`, whereClause, whereClause)
}
