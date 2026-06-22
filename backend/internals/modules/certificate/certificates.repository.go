package certificates

func (c *CertificateModule) IssueRepository(userID, courseID string) (*Certificate, error) {
	var cert Certificate
	err := c.DB.QueryRow(`
		INSERT INTO certificates (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO UPDATE SET issued_at = certificates.issued_at
		RETURNING id, user_id, course_id, issued_at`,
		userID, courseID,
	).Scan(&cert.ID, &cert.UserID, &cert.CourseID, &cert.IssuedAt)
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
	err := c.DB.QueryRow(`SELECT id, user_id, course_id, issued_at FROM certificates WHERE user_id = $1 AND course_id = $2`, userID, courseID).
		Scan(&cert.ID, &cert.UserID, &cert.CourseID, &cert.IssuedAt)
	return &cert, err
}
