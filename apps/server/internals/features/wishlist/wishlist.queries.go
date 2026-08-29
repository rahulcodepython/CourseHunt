package wishlist

const (
	CountUserWishlist = `SELECT COUNT(*) FROM wishlists WHERE user_id = $1;`

	CreateWishlist = `
		INSERT INTO wishlists (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO UPDATE SET added_at = NOW()
		RETURNING row_to_json(wishlists.*);
	`

	DeleteWishlist = `DELETE FROM wishlists WHERE user_id = $1 AND id = $2 RETURNING id;`

	ClearWishlist = `DELETE FROM wishlists WHERE user_id = $1;`

	ListWishlist = `
		SELECT jsonb_build_object(
			'total', COALESCE((SELECT COUNT(*) FROM wishlists w WHERE w.user_id = $1), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', w.id,
						'user_id', w.user_id,
						'added_at', w.added_at,
						'course', jsonb_build_object(
							'id', COALESCE(w.course_id::text, ''),
							'slug', COALESCE(c.slug, ''),
							'title', COALESCE(c.title, ''),
							'thumbnail', c.image_url
						)
					) ORDER BY w.added_at DESC
				)
				FROM (
					SELECT w.id, w.user_id, w.added_at, w.course_id
					FROM wishlists w
					WHERE w.user_id = $1
					ORDER BY w.added_at DESC
					LIMIT $2 OFFSET $3
				) w
				LEFT JOIN courses c ON w.course_id = c.id
			), '[]'::jsonb)
		);
	`
)
