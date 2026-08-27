package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type DiscussionsRepository struct {
	DB              *sqlx.DB
	EnrollmentsRepo *EnrollmentsRepository
	CoursesRepo     *CoursesRepository
}

func NewDiscussionsRepository(db *sqlx.DB, enrollmentsRepo *EnrollmentsRepository, coursesRepo *CoursesRepository) *DiscussionsRepository {
	return &DiscussionsRepository{DB: db, EnrollmentsRepo: enrollmentsRepo, CoursesRepo: coursesRepo}
}

// buildAuthCTE returns the auth CTE fragment for the given scope.
// $3 is always the userID parameter position across all discussion queries.
func buildAuthCTE(scope generic.AuthScope) string {
	switch scope {
	case generic.ScopeUser:
		return `
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN target_info ti ON e.course_id = ti.course_id
				WHERE e.user_id = $3 AND e.revoked = false
			) AS is_authorized
		),`
	case generic.ScopeTutor:
		return `
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM courses c
				JOIN target_info ti ON c.id = ti.course_id
				WHERE c.tutor_id = $3
			) AS is_authorized
		),`
	case generic.ScopeAdmin:
		return `
		auth AS (
			SELECT ($3::text IS NOT NULL OR true) AS is_authorized
		),`
	default:
		// ScopeUser — user access
		return `
		auth AS (
			SELECT ($3::text IS NOT NULL OR true) AS is_authorized
		),`
	}
}

// buildCreateAuthCTE handles the auth CTE for create operations,
// where the auth check uses lesson_info instead of target_info.
func buildCreateAuthCTE(scope generic.AuthScope) (string, bool) {
	switch scope {
	case generic.ScopeUser:
		return `
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $3 AND e.revoked = false
			) AS is_authorized
		),`, true
	case generic.ScopeTutor:
		return `
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM courses c
				JOIN lesson_info li ON c.id = li.course_id
				WHERE c.tutor_id = $3
			) AS is_authorized
		),`, true
	default:
		return `
		auth AS (
			SELECT ($3::text IS NOT NULL OR true) AS is_authorized
		),`, false
	}
}

// authRequiredForScope returns true if the scope requires authorization checks.
func authRequiredForScope(scope generic.AuthScope) bool {
	return scope == generic.ScopeUser || scope == generic.ScopeTutor
}

// buildUpdateAuthCTE returns the auth CTE for update operations.
// Unlike list/create, update checks are done against discussion_info.
func buildUpdateAuthCTE(scope generic.AuthScope) string {
	switch scope {
	case generic.ScopeUser:
		return `
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN discussion_info di ON e.course_id = di.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_authorized
		),`
	case generic.ScopeTutor:
		return `
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM courses c
				JOIN discussion_info di ON c.id = di.course_id
				WHERE c.tutor_id = $2
			) AS is_authorized
		),`
	default:
		return `auth AS (SELECT ($2::text IS NOT NULL OR true) AS is_authorized),`
	}
}

// buildDeleteAuthCTE returns the auth CTE for delete operations.
func buildDeleteAuthCTE(scope generic.AuthScope) (string, bool) {
	switch scope {
	case generic.ScopeUser:
		return `
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN discussion_info di ON e.course_id = di.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_authorized
		),`, true
	case generic.ScopeTutor:
		return `
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM courses c
				JOIN discussion_info di ON c.id = di.course_id
				WHERE c.tutor_id = $2
			) AS is_authorized
		),`, true
	case generic.ScopeAdmin:
		return ``, false
	default:
		return ``, false
	}
}

// buildOwnerCheck returns an ownership WHERE clause fragment and whether to use it.
// This is for update operations where ownership is required.
func ownerWhereClause(scope generic.AuthScope, userParam string) (string, bool) {
	switch scope {
	case generic.ScopeUser:
		return fmt.Sprintf("AND discussions.user_id = %s", userParam), true
	case generic.ScopeTutor:
		// Tutor can update any discussion in their course
		return "", false
	default:
		return "", false
	}
}

// ── Unified Repository Methods ──

func (r *DiscussionsRepository) ListRepository(lessonID, parentID, userID string, scope generic.AuthScope, page, limit int) ([]entities.Discussion, int, error) {
	if lessonID == "" && parentID == "" {
		return nil, 0, generic.ErrDiscussionsMissingTarget
	}
	offset := (page - 1) * limit

	type listResult struct {
		TargetExists bool            `db:"target_exists"`
		IsAuthorized bool            `db:"is_authorized"`
		Total        int             `db:"total"`
		Data         json.RawMessage `db:"data"`
	}
	var result listResult

	authCTE := buildAuthCTE(scope)
	hasAuth := authRequiredForScope(scope)

	query := fmt.Sprintf(`
		WITH target_info AS (
			SELECT l.id AS target_id, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = NULLIF($1, '')::uuid AND $1 != ''
			UNION ALL
			SELECT d.id AS target_id, d.course_id
			FROM discussions d
			WHERE d.id = NULLIF($2, '')::uuid AND $2 != ''
		),
		%s
		count_cte AS (
			SELECT COUNT(*) AS total
			FROM discussions d
			CROSS JOIN auth a
			WHERE 
				(($1 != '' AND d.lesson_id = NULLIF($1, '')::uuid AND d.parent_id IS NULL) OR
				($2 != '' AND d.parent_id = NULLIF($2, '')::uuid))
				AND a.is_authorized = true
		),
		data_cte AS (
			SELECT d.id, d.lesson_id, d.course_id, d.parent_id, d.content, d.reply_count, d.created_at, d.updated_at,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS "user"
			FROM discussions d
			JOIN "users" u ON u.id = d.user_id
			CROSS JOIN auth a
			WHERE 
				(($1 != '' AND d.lesson_id = NULLIF($1, '')::uuid AND d.parent_id IS NULL) OR
				($2 != '' AND d.parent_id = NULLIF($2, '')::uuid))
				AND a.is_authorized = true
			ORDER BY 
				CASE WHEN $1 != '' THEN d.created_at END DESC,
				CASE WHEN $2 != '' THEN d.created_at END ASC
			LIMIT $4 OFFSET $5
		)
		SELECT
			EXISTS(SELECT 1 FROM target_info) AS target_exists,
			%s AS is_authorized,
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, authCTE, map[bool]string{true: "COALESCE((SELECT is_authorized FROM auth), false)", false: "true"}[hasAuth])

	err := r.DB.Get(&result, query, lessonID, parentID, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	if !result.TargetExists {
		return nil, 0, generic.ErrDiscussionsTargetNotFound
	}
	if hasAuth && !result.IsAuthorized {
		return nil, 0, errorForScopeAuth(scope)
	}

	var list []entities.Discussion
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}

func (r *DiscussionsRepository) CreateRepository(userID string, req entities.CreateDiscussionRequest, scope generic.AuthScope) (*entities.Discussion, error) {
	type createResult struct {
		LessonExists bool             `db:"lesson_exists"`
		IsAuthorized bool             `db:"is_authorized"`
		ParentExists bool             `db:"parent_exists"`
		ParentValid  bool             `db:"parent_valid"`
		InsertedData *json.RawMessage `db:"inserted_data"`
	}
	var result createResult

	authCTE, requiresAuth := buildCreateAuthCTE(scope)

	query := fmt.Sprintf(`
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = NULLIF($1, '')::uuid
		),
		parent_info AS (
			SELECT id, lesson_id FROM discussions WHERE id = NULLIF($2, '')::uuid AND $2 != ''
		),
		%s
		parent_validation AS (
			SELECT 
				CASE 
					WHEN $2::text IS NULL OR $2::text = '' THEN true
					ELSE EXISTS(SELECT 1 FROM parent_info WHERE lesson_id = NULLIF($1, '')::uuid)
				END AS is_valid
		),
		inserted AS (
			INSERT INTO discussions (lesson_id, course_id, user_id, parent_id, content)
			SELECT NULLIF($1, '')::uuid, li.course_id, $3::uuid, NULLIF($2, '')::uuid, $4
			FROM lesson_info li
			CROSS JOIN auth a
			CROSS JOIN parent_validation pv
			WHERE a.is_authorized = true AND pv.is_valid = true
			RETURNING id, lesson_id, course_id, parent_id, content, reply_count, created_at, updated_at, user_id
		),
		inserted_with_user AS (
			SELECT i.id, i.lesson_id, i.course_id, i.parent_id, i.content, i.reply_count, i.created_at, i.updated_at,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS "user"
			FROM inserted i
			JOIN "users" u ON u.id = i.user_id
		),
		notified AS (
			INSERT INTO notifications (type, message, is_admin, is_tutor, is_student)
			SELECT 'discussion', COALESCE(u.name, u.email) || ' posted a new discussion in ' || COALESCE(c.title, 'a course'), true, true, false
			FROM inserted i
			JOIN "users" u ON u.id = i.user_id
			LEFT JOIN courses c ON c.id = i.course_id
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			%s AS is_authorized,
			CASE 
				WHEN $2::text IS NULL OR $2::text = '' THEN true
				ELSE EXISTS(SELECT 1 FROM parent_info)
			END AS parent_exists,
			COALESCE((SELECT is_valid FROM parent_validation), false) AS parent_valid,
			(SELECT row_to_json(inserted_with_user.*) FROM inserted_with_user) AS inserted_data
	`, authCTE, map[bool]string{true: "COALESCE((SELECT is_authorized FROM auth), false)", false: "true"}[requiresAuth])

	err := r.DB.Get(&result, query, req.LessonID, req.ParentID, userID, req.Content)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, generic.ErrDiscussionsLessonNotFound
	case requiresAuth && !result.IsAuthorized:
		return nil, errorForScopeAuth(scope)
	case !result.ParentExists:
		return nil, generic.ErrDiscussionsParentNotFound
	case !result.ParentValid:
		return nil, generic.ErrDiscussionsParentInvalid
	case result.InsertedData == nil:
		return nil, fmt.Errorf("failed to post discussion")
	}

	var d entities.Discussion
	if err := json.Unmarshal(*result.InsertedData, &d); err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *DiscussionsRepository) UpdateRepository(id, userID string, content string, scope generic.AuthScope) (*entities.Discussion, error) {
	type updateResult struct {
		DiscussionExists bool             `db:"discussion_exists"`
		IsOwner          bool             `db:"is_owner"`
		IsAuthorized     bool             `db:"is_authorized"`
		UpdatedData      *json.RawMessage `db:"updated_data"`
	}
	var result updateResult

	authCTE := buildUpdateAuthCTE(scope)
	hasAuth := authRequiredForScope(scope)

	ownerClause, checkOwner := ownerWhereClause(scope, "$2")

	query := fmt.Sprintf(`
		WITH discussion_info AS (
			SELECT id, user_id, course_id FROM discussions WHERE id = NULLIF($1, '')::uuid
		),
		%s
		updated AS (
			UPDATE discussions
			SET content = $3, updated_at = CURRENT_TIMESTAMP
			FROM discussion_info di
			CROSS JOIN auth a
			WHERE discussions.id = NULLIF($1, '')::uuid AND a.is_authorized = true %s
			RETURNING discussions.id, discussions.lesson_id, discussions.course_id, discussions.parent_id, discussions.content, discussions.reply_count, discussions.created_at, discussions.updated_at, discussions.user_id
		),
		updated_with_user AS (
			SELECT u.id, u.lesson_id, u.course_id, u.parent_id, u.content, u.reply_count, u.created_at, u.updated_at,
			       json_build_object('id', usr.id, 'name', COALESCE(usr.name, ''), 'image', COALESCE(usr.image, '')) AS "user"
			FROM updated u
			JOIN "users" usr ON usr.id = u.user_id
		)
		SELECT
			EXISTS(SELECT 1 FROM discussion_info) AS discussion_exists,
			%s AS is_owner,
			%s AS is_authorized,
			(SELECT row_to_json(updated_with_user.*) FROM updated_with_user) AS updated_data
	`, authCTE, ownerClause,
		map[bool]string{true: "EXISTS(SELECT 1 FROM discussion_info WHERE user_id = NULLIF($2, '')::uuid)", false: "true"}[checkOwner],
		map[bool]string{true: "COALESCE((SELECT is_authorized FROM auth), false)", false: "true"}[hasAuth])

	err := r.DB.Get(&result, query, id, userID, content)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.DiscussionExists:
		return nil, generic.ErrDiscussionsDiscussionNotFound
	case checkOwner && !result.IsOwner:
		return nil, generic.ErrDiscussionsAccessDenied
	case hasAuth && !result.IsAuthorized:
		return nil, errorForScopeAuth(scope)
	case result.UpdatedData == nil:
		return nil, fmt.Errorf("failed to update discussion")
	}

	var d entities.Discussion
	if err := json.Unmarshal(*result.UpdatedData, &d); err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *DiscussionsRepository) DeleteRepository(id, userID string, scope generic.AuthScope) (string, error) {
	type deleteResult struct {
		DiscussionExists bool    `db:"discussion_exists"`
		IsAuthorized     bool    `db:"is_authorized"`
		DeletedID        *string `db:"deleted_id"`
	}
	var result deleteResult

	authCTE, requiresAuth := buildDeleteAuthCTE(scope)

	if scope == generic.ScopeAdmin {
		query := `
			WITH discussion_info AS (
				SELECT id FROM discussions WHERE id = $1
			),
			deleted AS (
				DELETE FROM discussions WHERE id = $1 RETURNING id
			)
			SELECT
				EXISTS(SELECT 1 FROM discussion_info) AS discussion_exists,
				true AS is_authorized,
				(SELECT id FROM deleted) AS deleted_id
		`
		err := r.DB.Get(&result, query, id)
		if err != nil {
			return "", err
		}
	} else {
		query := fmt.Sprintf(`
			WITH discussion_info AS (
				SELECT id, user_id, course_id FROM discussions WHERE id = $1
			),
			%s
			deleted AS (
				DELETE FROM discussions
				USING discussion_info di, auth a
				WHERE discussions.id = $1 AND a.is_authorized = true
				RETURNING discussions.id
			)
			SELECT
				EXISTS(SELECT 1 FROM discussion_info) AS discussion_exists,
				COALESCE((SELECT is_authorized FROM auth), false) AS is_authorized,
				(SELECT id FROM deleted) AS deleted_id
		`, authCTE)
		err := r.DB.Get(&result, query, id, userID)
		if err != nil {
			return "", err
		}
	}

	switch {
	case !result.DiscussionExists:
		return "", generic.ErrDiscussionsDiscussionNotFound
	case requiresAuth && !result.IsAuthorized:
		return "", errorForScopeAuth(scope)
	case result.DeletedID == nil:
		return "", fmt.Errorf("failed to delete discussion")
	}

	return *result.DeletedID, nil
}

func errorForScopeAuth(scope generic.AuthScope) error {
	switch scope {
	case generic.ScopeUser:
		return generic.ErrDiscussionsNotEnrolled
	case generic.ScopeTutor:
		return generic.ErrDiscussionsAccessDenied
	default:
		return generic.ErrDiscussionsAccessDenied
	}
}
