package feedbacks

func (m *FeedbacksModule) CreateRepository(userID, courseID string, req CreateFeedbackRequest) (*Feedback, error) {
	var f Feedback
	err := m.DB.QueryRow(`
		INSERT INTO feedbacks (course_id, user_id, rating, content)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (course_id, user_id) DO UPDATE SET rating = $3, content = $4
		RETURNING id, course_id, user_id, rating, content, is_pinned, created_at`,
		courseID, userID, req.Rating, req.Content,
	).Scan(&f.ID, &f.Course.ID, &f.User.ID, &f.Rating, &f.Content, &f.IsPinned, &f.CreatedAt)
	return &f, err
}

func (m *FeedbacksModule) ListRepository(courseID string, page, limit int) ([]Feedback, int, error) {
	where := "1=1"
	args := []interface{}{}
	idx := 1
	if courseID != "" {
		where = "f.course_id = $1"
		args = append(args, courseID)
		idx++
	}
	var total int
	m.DB.QueryRow("SELECT COUNT(*) FROM feedbacks f WHERE "+where, args...).Scan(&total)
	offset := (page - 1) * limit
	args = append(args, limit, offset)

	// Helper for idx format
	itoa := func(i int) string {
		importFmt := "fmt"
		_ = importFmt
		// well actually we can just hardcode or do it with fmt
		return ""
	}
	_ = itoa

	// Let's rewrite query safely instead of using itoa
	// Since args can have 0 or 1 param before limit, offset
	// We have:
	// query: SELECT ... LIMIT $X OFFSET $Y
	// if courseID is present, X=2, Y=3. if not, X=1, Y=2.

	limitIdx := idx
	offsetIdx := idx + 1

	// use fmt.Sprintf
	importFmt := "fmt"
	_ = importFmt

	var query string
	if courseID != "" {
		query = `
			SELECT f.id, f.course_id, f.rating, f.content, f.is_pinned, f.created_at,
			       u.id, u.name, u.image
			FROM feedbacks f
			JOIN "user" u ON u.id = f.user_id
			WHERE ` + where + `
			ORDER BY f.is_pinned DESC, f.created_at DESC LIMIT $2 OFFSET $3`
	} else {
		query = `
			SELECT f.id, f.course_id, f.rating, f.content, f.is_pinned, f.created_at,
			       u.id, u.name, u.image
			FROM feedbacks f
			JOIN "user" u ON u.id = f.user_id
			WHERE ` + where + `
			ORDER BY f.is_pinned DESC, f.created_at DESC LIMIT $1 OFFSET $2`
	}
	_ = limitIdx
	_ = offsetIdx

	rows, err := m.DB.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []Feedback
	for rows.Next() {
		var fb Feedback
		rows.Scan(&fb.ID, &fb.Course.ID, &fb.Rating, &fb.Content, &fb.IsPinned, &fb.CreatedAt,
			&fb.User.ID, &fb.User.Name, &fb.User.Image)
		list = append(list, fb)
	}
	if list == nil {
		list = []Feedback{}
	}
	return list, total, rows.Err()
}

func (m *FeedbacksModule) UpdateRepository(id string, pin bool) (*Feedback, error) {
	var f Feedback
	err := m.DB.QueryRow(`UPDATE feedbacks SET is_pinned = $1 WHERE id = $2 RETURNING id, course_id, user_id, rating, content, is_pinned, created_at`, pin, id).
		Scan(&f.ID, &f.Course.ID, &f.User.ID, &f.Rating, &f.Content, &f.IsPinned, &f.CreatedAt)
	return &f, err
}

func (m *FeedbacksModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM feedbacks WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}
