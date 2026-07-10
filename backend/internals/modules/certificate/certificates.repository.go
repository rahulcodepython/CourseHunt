package certificate

func (c *CertificateModule) IssueRepository(userID, courseID string) (*Certificate, error) {
	var cert Certificate
	query := `
		WITH inserted AS (
			INSERT INTO certificates (user_id, course_id)
			VALUES ($1, $2)
			ON CONFLICT (user_id, course_id) DO UPDATE SET issued_at = certificates.issued_at
			RETURNING id, user_id, course_id, issued_at
		)
		SELECT 
			i.id, 
			i.user_id, 
			i.course_id, 
			COALESCE(co.title, '') AS course_title, 
			co.image_url AS course_thumbnail, 
			i.issued_at 
		FROM inserted i
		LEFT JOIN courses co ON i.course_id = co.id
	`
	err := c.DB.QueryRow(query, userID, courseID).Scan(
		&cert.ID,
		&cert.UserID,
		&cert.Course.ID,
		&cert.Course.Title,
		&cert.Course.Thumbnail,
		&cert.IssuedAt,
	)
	return &cert, err
}

func (c *CertificateModule) ListRepository(userID string) ([]Certificate, error) {
	rows, err := c.DB.Query(`
		SELECT 
			cert.id, 
			cert.user_id, 
			cert.course_id, 
			COALESCE(co.title, '') AS course_title, 
			co.image_url AS course_thumbnail, 
			cert.issued_at
		FROM certificates cert
		LEFT JOIN courses co ON co.id = cert.course_id
		WHERE cert.user_id = $1
		ORDER BY cert.issued_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Certificate
	for rows.Next() {
		var cert Certificate
		if err := rows.Scan(
			&cert.ID,
			&cert.UserID,
			&cert.Course.ID,
			&cert.Course.Title,
			&cert.Course.Thumbnail,
			&cert.IssuedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, cert)
	}
	if list == nil {
		list = []Certificate{}
	}
	return list, rows.Err()
}

func (c *CertificateModule) GetRepository(userID, courseID string) (*Certificate, error) {
	var cert Certificate
	query := `
		SELECT 
			c.id, 
			c.user_id, 
			c.course_id, 
			COALESCE(co.title, '') AS course_title, 
			co.image_url AS course_thumbnail, 
			c.issued_at 
		FROM certificates c
		LEFT JOIN courses co ON c.course_id = co.id
		WHERE c.user_id = $1 AND c.course_id = $2
	`
	err := c.DB.QueryRow(query, userID, courseID).Scan(
		&cert.ID,
		&cert.UserID,
		&cert.Course.ID,
		&cert.Course.Title,
		&cert.Course.Thumbnail,
		&cert.IssuedAt,
	)
	return &cert, err
}

func (c *CertificateModule) IsEnrollmentCompletedRepository(userID, courseID string) (bool, error) {
	var completed bool
	err := c.DB.QueryRow(`SELECT completed FROM enrollments WHERE user_id = $1 AND course_id = $2`, userID, courseID).Scan(&completed)
	if err != nil {
		return false, err
	}
	return completed, nil
}
