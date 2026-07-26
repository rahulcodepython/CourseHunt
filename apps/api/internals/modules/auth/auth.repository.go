package auth

import (
	"encoding/json"
	"time"
)

func (m *AuthModule) LoginWithEmailRepository(email, sessionHash string, expiresAt time.Time) (*User, string, error) {
	query := `
		WITH user_cte AS (
			SELECT u.id, u.name, u.email, u."emailVerified", u.image,
			       u."createdAt", u."updatedAt", u.banned,
			       c.password_hash,
			       c.password_changed_at AS "passwordChangedAt"
			FROM "user" u
			LEFT JOIN credentials c ON c.user_id = u.id
			WHERE u.email = $1
		),
		session_insert AS (
			INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
			SELECT id, $2, $3 FROM user_cte WHERE banned = false
		),
		roles_cte AS (
			SELECT COALESCE(json_agg(r.name ORDER BY r.name), '[]'::json) AS roles
			FROM user_roles ur
			JOIN roles r ON r.id = ur.role_id
			WHERE ur.user_id = (SELECT id FROM user_cte)
		),
		permissions_cte AS (
			SELECT COALESCE(json_agg(DISTINCT p.name ORDER BY p.name), '[]'::json) AS permissions
			FROM user_roles ur
			JOIN role_permissions rp ON rp.role_id = ur.role_id
			JOIN permissions p ON p.id = rp.permission_id
			WHERE ur.user_id = (SELECT id FROM user_cte)
		)
		SELECT 
			row_to_json(t) AS user_json,
			COALESCE((SELECT password_hash FROM user_cte), '') AS password_hash
		FROM (
			SELECT
				uc.id, uc.name, uc.email, uc."emailVerified", uc.image,
				uc."createdAt", uc."updatedAt", uc.banned, uc."passwordChangedAt",
				COALESCE((SELECT roles FROM roles_cte), '[]'::json) AS roles,
				COALESCE((SELECT permissions FROM permissions_cte), '[]'::json) AS permissions
			FROM user_cte uc
		) t
	`

	var jsonBytes []byte
	var hash string
	err := m.DB.QueryRowx(query, email, sessionHash, expiresAt).Scan(&jsonBytes, &hash)
	if err != nil {
		return nil, "", err
	}

	var user User
	if err := json.Unmarshal(jsonBytes, &user); err != nil {
		return nil, "", err
	}

	return &user, hash, nil
}

func (m *AuthModule) LoginWithGoogleRepository(email, sessionHash string, expiresAt time.Time) (*User, error) {
	query := `
		WITH user_cte AS (
			SELECT u.id, u.name, u.email, u."emailVerified", u.image,
			       u."createdAt", u."updatedAt", u.banned,
			       c.password_changed_at AS "passwordChangedAt"
			FROM "user" u
			LEFT JOIN credentials c ON c.user_id = u.id
			WHERE u.email = $1
		),
		session_insert AS (
			INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
			SELECT id, $2, $3 FROM user_cte WHERE banned = false
		),
		roles_cte AS (
			SELECT COALESCE(json_agg(r.name ORDER BY r.name), '[]'::json) AS roles
			FROM user_roles ur
			JOIN roles r ON r.id = ur.role_id
			WHERE ur.user_id = (SELECT id FROM user_cte)
		),
		permissions_cte AS (
			SELECT COALESCE(json_agg(DISTINCT p.name ORDER BY p.name), '[]'::json) AS permissions
			FROM user_roles ur
			JOIN role_permissions rp ON rp.role_id = ur.role_id
			JOIN permissions p ON p.id = rp.permission_id
			WHERE ur.user_id = (SELECT id FROM user_cte)
		)
		SELECT row_to_json(t) FROM (
			SELECT
				uc.id, uc.name, uc.email, uc."emailVerified", uc.image,
				uc."createdAt", uc."updatedAt", uc.banned, uc."passwordChangedAt",
				COALESCE((SELECT roles FROM roles_cte), '[]'::json) AS roles,
				COALESCE((SELECT permissions FROM permissions_cte), '[]'::json) AS permissions
			FROM user_cte uc
		) t
	`

	var jsonBytes []byte
	row := m.DB.QueryRowx(query, email, sessionHash, expiresAt)
	if err := row.Scan(&jsonBytes); err != nil {
		return nil, err
	}
	var u User
	if err := json.Unmarshal(jsonBytes, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (m *AuthModule) RotateSessionRepository(oldHash, newHash string, expiresAt time.Time) (*User, error) {
	query := `
		WITH deleted_session AS (
			DELETE FROM sessions WHERE refresh_token_hash = $1 AND expires_at > NOW()
			RETURNING user_id
		),
		user_cte AS (
			SELECT u.id, u.name, u.email, u."emailVerified", u.image,
			       u."createdAt", u."updatedAt", u.banned,
			       c.password_changed_at AS "passwordChangedAt"
			FROM "user" u
			LEFT JOIN credentials c ON c.user_id = u.id
			WHERE u.id = (SELECT user_id FROM deleted_session)
		),
		inserted_session AS (
			INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
			SELECT id, $2, $3 FROM user_cte WHERE banned = false
		),
		roles_cte AS (
			SELECT COALESCE(json_agg(r.name ORDER BY r.name), '[]'::json) AS roles
			FROM user_roles ur
			JOIN roles r ON r.id = ur.role_id
			WHERE ur.user_id = (SELECT id FROM user_cte)
		),
		permissions_cte AS (
			SELECT COALESCE(json_agg(DISTINCT p.name ORDER BY p.name), '[]'::json) AS permissions
			FROM user_roles ur
			JOIN role_permissions rp ON rp.role_id = ur.role_id
			JOIN permissions p ON p.id = rp.permission_id
			WHERE ur.user_id = (SELECT id FROM user_cte)
		)
		SELECT row_to_json(t) FROM (
			SELECT
				uc.id, uc.name, uc.email, uc."emailVerified", uc.image,
				uc."createdAt", uc."updatedAt", uc.banned, uc."passwordChangedAt",
				COALESCE((SELECT roles FROM roles_cte), '[]'::json) AS roles,
				COALESCE((SELECT permissions FROM permissions_cte), '[]'::json) AS permissions
			FROM user_cte uc
		) t
	`

	var jsonBytes []byte
	row := m.DB.QueryRowx(query, oldHash, newHash, expiresAt)
	if err := row.Scan(&jsonBytes); err != nil {
		return nil, err
	}
	var u User
	if err := json.Unmarshal(jsonBytes, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (m *AuthModule) DeleteSessionRepository(hash string) error {
	_, err := m.DB.Exec(`DELETE FROM sessions WHERE refresh_token_hash = $1`, hash)
	return err
}

func (m *AuthModule) CreateUserRepository(hashedPassword, name, email, createdBy, role string) (string, error) {
	query := `
		WITH target_role AS (
			SELECT id FROM roles WHERE name = $5
		),
		inserted_user AS (
			INSERT INTO "user" (id, name, email, "emailVerified", "createdBy", "createdAt", "updatedAt")
			SELECT gen_random_uuid()::text, $1, $2, true, $3, NOW(), NOW()
			FROM target_role
			RETURNING id
		),
		inserted_credentials AS (
			INSERT INTO credentials (user_id, password_hash, created_at, updated_at)
			SELECT id, $4, NOW(), NOW() FROM inserted_user
		),
		inserted_role AS (
			INSERT INTO user_roles (user_id, role_id)
			SELECT iu.id, tr.id
			FROM inserted_user iu, target_role tr
			ON CONFLICT DO NOTHING
		)
		SELECT id FROM inserted_user
	`

	var userID string
	err := m.DB.QueryRowx(query, name, email, createdBy, hashedPassword, role).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

func (m *AuthModule) ChangePasswordRepository(userID, newHashedPassword, newSessionHash string, expiresAt time.Time) (*User, string, error) {
	query := `
		WITH old_cred AS (
			SELECT password_hash FROM credentials WHERE user_id = $1
		),
		updated_credentials AS (
			INSERT INTO credentials (user_id, password_hash, password_changed_at, created_at, updated_at)
			VALUES ($1, $2, NOW(), NOW(), NOW())
			ON CONFLICT (user_id) DO UPDATE
			SET password_hash = EXCLUDED.password_hash,
				password_changed_at = NOW(),
				updated_at = NOW()
			RETURNING user_id, password_changed_at
		),
		deleted_sessions AS (
			DELETE FROM sessions WHERE user_id = $1
		),
		inserted_session AS (
			INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
			VALUES ($1, $3, $4)
		),
		user_cte AS (
			SELECT u.id, u.name, u.email, u."emailVerified", u.image,
			       u."createdAt", u."updatedAt", u.banned,
			       uc.password_changed_at AS "passwordChangedAt"
			FROM "user" u
			JOIN updated_credentials uc ON uc.user_id = u.id
		),
		roles_cte AS (
			SELECT COALESCE(json_agg(r.name ORDER BY r.name), '[]'::json) AS roles
			FROM user_roles ur
			JOIN roles r ON r.id = ur.role_id
			WHERE ur.user_id = (SELECT id FROM user_cte)
		),
		permissions_cte AS (
			SELECT COALESCE(json_agg(DISTINCT p.name ORDER BY p.name), '[]'::json) AS permissions
			FROM user_roles ur
			JOIN role_permissions rp ON rp.role_id = ur.role_id
			JOIN permissions p ON p.id = rp.permission_id
			WHERE ur.user_id = (SELECT id FROM user_cte)
		)
		SELECT 
			row_to_json(t) AS user_json,
			COALESCE((SELECT password_hash FROM old_cred), '') AS old_password_hash
		FROM (
			SELECT
				uc.id, uc.name, uc.email, uc."emailVerified", uc.image,
				uc."createdAt", uc."updatedAt", uc.banned, uc."passwordChangedAt",
				COALESCE((SELECT roles FROM roles_cte), '[]'::json) AS roles,
				COALESCE((SELECT permissions FROM permissions_cte), '[]'::json) AS permissions
			FROM user_cte uc
		) t
	`

	var jsonBytes []byte
	var oldHash string
	err := m.DB.QueryRowx(query, userID, newHashedPassword, newSessionHash, expiresAt).Scan(&jsonBytes, &oldHash)
	if err != nil {
		return nil, "", err
	}

	var user User
	if err := json.Unmarshal(jsonBytes, &user); err != nil {
		return nil, "", err
	}

	return &user, oldHash, nil
}
