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

func (c *CertificateModule) ListRepository(userID string) ([]CertificateResponse, error) {
	rows, err := c.DB.Query(`
		SELECT cert.id, cert.user_id, cert.course_id, co.title, cert.issued_at
		FROM certificates cert
		JOIN courses co ON co.id = cert.course_id
		WHERE cert.user_id = $1
		ORDER BY cert.issued_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []CertificateResponse
	for rows.Next() {
		var cr CertificateResponse
		if err := rows.Scan(&cr.ID, &cr.UserID, &cr.CourseID, &cr.CourseTitle, &cr.IssuedAt); err != nil {
			return nil, err
		}
		list = append(list, cr)
	}
	if list == nil {
		list = []CertificateResponse{}
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
