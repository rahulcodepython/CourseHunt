package users

import (
	"encoding/json"
	"errors"
)

var (
	ErrNotVerified = errors.New("access denied: email is not verified")
)

func (m *UsersModule) ReadUserProfileRepository(userID string) (*UserProfile, error) {
	var p UserProfile
	err := m.DB.Get(&p, `SELECT id, user_id, headline, bio, website, updated_at FROM user_profile WHERE user_id = $1`, userID)
	return &p, err
}

func (m *UsersModule) ReadTutorProfileRepository(userID string) (*TutorProfile, error) {
	var p TutorProfile
	err := m.DB.Get(&p, `SELECT id, user_id, headline, bio, website, total_students, rating_avg, updated_at FROM tutor_profile WHERE user_id = $1`, userID)
	return &p, err
}

func (m *UsersModule) UpsertUserProfileRepository(userID string, req UpdateProfileRequest) (*UserProfile, error) {
	var result struct {
		EmailVerified bool             `db:"email_verified"`
		InsertedData  *json.RawMessage `db:"inserted_data"`
	}

	query := `
		WITH auth AS (
			SELECT "emailVerified" FROM "user" WHERE id = $1
		),
		inserted AS (
			INSERT INTO user_profile (user_id, headline, bio, website, updated_at)
			SELECT $1, $2, $3, $4, CURRENT_TIMESTAMP
			FROM auth a
			WHERE a."emailVerified" = true
			ON CONFLICT (user_id) DO UPDATE SET headline = $2, bio = $3, website = $4, updated_at = CURRENT_TIMESTAMP
			RETURNING id, user_id, headline, bio, website, updated_at
		)
		SELECT 
			COALESCE((SELECT "emailVerified" FROM auth), false) AS email_verified,
			(SELECT row_to_json(inserted.*) FROM inserted) AS inserted_data
	`
	err := m.DB.Get(&result, query, userID, req.Headline, req.Bio, req.Website)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.EmailVerified:
		return nil, ErrNotVerified
	case result.InsertedData == nil:
		return nil, errors.New("failed to save profile")
	}

	var p UserProfile
	if err := json.Unmarshal(*result.InsertedData, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (m *UsersModule) UpsertTutorProfileRepository(userID string, req UpdateProfileRequest) (*TutorProfile, error) {
	var result struct {
		EmailVerified bool             `db:"email_verified"`
		InsertedData  *json.RawMessage `db:"inserted_data"`
	}

	query := `
		WITH auth AS (
			SELECT "emailVerified" FROM "user" WHERE id = $1
		),
		inserted AS (
			INSERT INTO tutor_profile (user_id, headline, bio, website, updated_at)
			SELECT $1, $2, $3, $4, CURRENT_TIMESTAMP
			FROM auth a
			WHERE a."emailVerified" = true
			ON CONFLICT (user_id) DO UPDATE SET headline = $2, bio = $3, website = $4, updated_at = CURRENT_TIMESTAMP
			RETURNING id, user_id, headline, bio, website, total_students, rating_avg, updated_at
		)
		SELECT 
			COALESCE((SELECT "emailVerified" FROM auth), false) AS email_verified,
			(SELECT row_to_json(inserted.*) FROM inserted) AS inserted_data
	`
	err := m.DB.Get(&result, query, userID, req.Headline, req.Bio, req.Website)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.EmailVerified:
		return nil, ErrNotVerified
	case result.InsertedData == nil:
		return nil, errors.New("failed to save tutor profile")
	}

	var p TutorProfile
	if err := json.Unmarshal(*result.InsertedData, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (m *UsersModule) AdminListProfilesRepository(page, limit int) ([]AdminProfileItem, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}

	err := m.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM "user" u
		),
		data_cte AS (
			SELECT 
				u.id AS user_id,
				u.email,
				COALESCE(u.name, '') AS name,
				u.role,
				COALESCE(up.id, tp.id, '') AS id,
				COALESCE(up.headline, tp.headline) AS headline,
				COALESCE(up.bio, tp.bio) AS bio,
				COALESCE(up.website, tp.website) AS website,
				tp.total_students,
				tp.rating_avg,
				COALESCE(up.updated_at, tp.updated_at, CURRENT_TIMESTAMP) AS updated_at
			FROM "user" u
			LEFT JOIN user_profile up ON up.user_id = u.id
			LEFT JOIN tutor_profile tp ON tp.user_id = u.id
			ORDER BY u.created_at DESC
			LIMIT $1 OFFSET $2
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, limit, offset)

	if err != nil {
		return nil, 0, err
	}

	var list []AdminProfileItem
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}
