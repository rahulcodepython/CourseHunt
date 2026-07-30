package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"
	"errors"
)

func (r *UsersRepository) ReadProfileRepository(userID string) (*entities.Profile, error) {
	var p entities.Profile
	if err := r.DB.Get(&p, `SELECT id, user_id, headline, bio, website, total_students, rating_avg, created_at, updated_at FROM profiles WHERE user_id = $1`, userID); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *UsersRepository) ReadUserProfileRepository(userID string) (*entities.Profile, error) {
	return r.ReadProfileRepository(userID)
}

func (r *UsersRepository) ReadTutorProfileRepository(userID string) (*entities.Profile, error) {
	return r.ReadProfileRepository(userID)
}

func (r *UsersRepository) UpsertProfileRepository(userID string, req entities.UpdateProfileRequest) (*entities.Profile, error) {
	var result struct {
		EmailVerified bool             `db:"email_verified"`
		InsertedData  *json.RawMessage `db:"inserted_data"`
	}

	query := `
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
			(SELECT row_to_json(inserted.*) FROM inserted) AS inserted_data
	`
	err := r.DB.Get(&result, query, userID, req.Headline, req.Bio, req.Website)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.EmailVerified:
		return nil, generic.ErrUsersNotVerified
	case result.InsertedData == nil:
		return nil, errors.New("failed to save profile")
	}

	var p entities.Profile
	if err := json.Unmarshal(*result.InsertedData, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *UsersRepository) UpsertUserProfileRepository(userID string, req entities.UpdateProfileRequest) (*entities.Profile, error) {
	return r.UpsertProfileRepository(userID, req)
}

func (r *UsersRepository) UpsertTutorProfileRepository(userID string, req entities.UpdateProfileRequest) (*entities.Profile, error) {
	return r.UpsertProfileRepository(userID, req)
}

func (r *UsersRepository) AdminListProfilesRepository(page, limit int) ([]entities.AdminProfileItem, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}

	err := r.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM "users" u
		),
		data_cte AS (
			SELECT 
				u.id AS user_id,
				u.email,
				COALESCE(u.name, '') AS name,
				COALESCE(r.name, '') AS role,
				COALESCE(p.id, '') AS id,
				p.headline,
				p.bio,
				p.website,
				p.total_students,
				p.rating_avg,
				COALESCE(p.updated_at, u."updatedAt", CURRENT_TIMESTAMP) AS updated_at
			FROM "users" u
			LEFT JOIN profiles p ON p.user_id = u.id
			LEFT JOIN user_roles ur ON ur.user_id = u.id
			LEFT JOIN roles r ON r.id = ur.role_id
			ORDER BY u."createdAt" DESC
			LIMIT $1 OFFSET $2
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, limit, offset)

	if err != nil {
		return nil, 0, err
	}

	var list []entities.AdminProfileItem
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}
