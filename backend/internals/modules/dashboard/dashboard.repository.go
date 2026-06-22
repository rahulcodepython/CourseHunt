package dashboard

func (m *DashboardModule) UserDashboardRepository(userID string) (*UserDashboard, error) {
	var d UserDashboard

	m.DB.QueryRow(`SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND revoked = false`, userID).Scan(&d.EnrolledCoursesCount)
	m.DB.QueryRow(`SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND revoked = false AND completed = true`, userID).Scan(&d.CompletedCoursesCount)
	d.InProgressCoursesCount = d.EnrolledCoursesCount - d.CompletedCoursesCount
	m.DB.QueryRow(`SELECT COUNT(*) FROM certificates WHERE user_id = $1`, userID).Scan(&d.CertificatesCount)

	rows, _ := m.DB.Query(`
		SELECT c.id, c.slug, c.title, c.image_url, e.completion_percent
		FROM enrollments e JOIN courses c ON c.id = e.course_id
		WHERE e.user_id = $1 AND e.revoked = false
		ORDER BY e.enrolled_at DESC LIMIT 5`, userID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var rc RecentCourseCard
			rows.Scan(&rc.ID, &rc.Slug, &rc.Title, &rc.ImageURL, &rc.CompletionPercent)
			d.RecentCourses = append(d.RecentCourses, rc)
		}
	}
	if d.RecentCourses == nil {
		d.RecentCourses = []RecentCourseCard{}
	}

	certRows, _ := m.DB.Query(`
		SELECT c.title, cert.issued_at
		FROM certificates cert JOIN courses c ON c.id = cert.course_id
		WHERE cert.user_id = $1 ORDER BY cert.issued_at DESC LIMIT 5`, userID)
	if certRows != nil {
		defer certRows.Close()
		for certRows.Next() {
			var rc RecentCertificate
			certRows.Scan(&rc.CourseTitle, &rc.IssuedAt)
			d.RecentCertificates = append(d.RecentCertificates, rc)
		}
	}
	if d.RecentCertificates == nil {
		d.RecentCertificates = []RecentCertificate{}
	}
	return &d, nil
}

func (m *DashboardModule) TutorDashboardRepository(tutorID string) (*TutorDashboard, error) {
	var d TutorDashboard

	m.DB.QueryRow(`SELECT COUNT(*) FROM courses WHERE tutor_id = $1`, tutorID).Scan(&d.TotalCourses)
	m.DB.QueryRow(`SELECT COUNT(*) FROM courses WHERE tutor_id = $1 AND status = 'published'`, tutorID).Scan(&d.PublishedCourses)
	d.DraftCourses = d.TotalCourses - d.PublishedCourses

	m.DB.QueryRow(`SELECT COALESCE(total_students,0), COALESCE(rating_avg,0) FROM tutor_profile WHERE user_id = $1`, tutorID).
		Scan(&d.TotalStudents, &d.RatingAvg)

	m.DB.QueryRow(`
		SELECT COALESCE(SUM(t.amount),0) FROM transactions t
		JOIN courses c ON c.id = t.course_id
		WHERE c.tutor_id = $1 AND t.status = 'success'`, tutorID).Scan(&d.TotalRevenue)

	txRows, _ := m.DB.Query(`
		SELECT u.name, c.title, t.amount, t.created_at
		FROM transactions t
		JOIN "user" u ON u.id = t.user_id
		JOIN courses c ON c.id = t.course_id
		WHERE c.tutor_id = $1 AND t.status = 'success'
		ORDER BY t.created_at DESC LIMIT 10`, tutorID)
	if txRows != nil {
		defer txRows.Close()
		for txRows.Next() {
			var tx TutorRecentTransaction
			txRows.Scan(&tx.UserName, &tx.CourseTitle, &tx.Amount, &tx.Date)
			d.RecentTransactions = append(d.RecentTransactions, tx)
		}
	}
	if d.RecentTransactions == nil {
		d.RecentTransactions = []TutorRecentTransaction{}
	}

	statsRows, _ := m.DB.Query(`
		SELECT c.id, c.title,
		       COUNT(DISTINCT e.user_id) AS students,
		       COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0) AS revenue
		FROM courses c
		LEFT JOIN enrollments e ON e.course_id = c.id
		LEFT JOIN transactions t ON t.course_id = c.id
		WHERE c.tutor_id = $1
		GROUP BY c.id, c.title
		ORDER BY revenue DESC`, tutorID)
	if statsRows != nil {
		defer statsRows.Close()
		for statsRows.Next() {
			var cs TutorCourseStat
			statsRows.Scan(&cs.CourseID, &cs.Title, &cs.Students, &cs.Revenue)
			d.CourseStats = append(d.CourseStats, cs)
		}
	}
	if d.CourseStats == nil {
		d.CourseStats = []TutorCourseStat{}
	}
	return &d, nil
}

func (m *DashboardModule) AdminDashboardRepository() (*AdminDashboard, error) {
	var d AdminDashboard

	m.DB.QueryRow(`SELECT COUNT(*) FROM "user"`).Scan(&d.TotalUsers)
	m.DB.QueryRow(`SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles ro ON ro.id = ur.role_id WHERE ro.name = 'tutor'`).Scan(&d.TotalTutors)
	m.DB.QueryRow(`SELECT COUNT(*) FROM courses`).Scan(&d.TotalCourses)
	m.DB.QueryRow(`SELECT COUNT(*) FROM enrollments`).Scan(&d.TotalEnrollments)
	m.DB.QueryRow(`SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status = 'success'`).Scan(&d.TotalRevenue)
	m.DB.QueryRow(`SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status = 'success' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`).Scan(&d.RevenueThisMonth)

	txRows, _ := m.DB.Query(`SELECT id, user_id, course_id, amount, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 20`)
	if txRows != nil {
		defer txRows.Close()
		for txRows.Next() {
			var t AdminRecentTransaction
			txRows.Scan(&t.ID, &t.UserID, &t.CourseID, &t.Amount, &t.Status, &t.CreatedAt)
			d.RecentTransactions = append(d.RecentTransactions, t)
		}
	}
	if d.RecentTransactions == nil {
		d.RecentTransactions = []AdminRecentTransaction{}
	}

	topRows, _ := m.DB.Query(`
		SELECT c.title, COUNT(DISTINCT e.user_id) AS students, COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0) AS revenue
		FROM courses c
		LEFT JOIN enrollments e ON e.course_id = c.id
		LEFT JOIN transactions t ON t.course_id = c.id
		GROUP BY c.id, c.title
		ORDER BY revenue DESC LIMIT 10`)
	if topRows != nil {
		defer topRows.Close()
		for topRows.Next() {
			var tc AdminTopCourse
			topRows.Scan(&tc.Title, &tc.Students, &tc.Revenue)
			d.TopCourses = append(d.TopCourses, tc)
		}
	}
	if d.TopCourses == nil {
		d.TopCourses = []AdminTopCourse{}
	}

	growthRows, _ := m.DB.Query(`
		SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*) AS count
		FROM "user"
		WHERE "createdAt" >= CURRENT_DATE - INTERVAL '12 months'
		GROUP BY month ORDER BY month`)
	if growthRows != nil {
		defer growthRows.Close()
		for growthRows.Next() {
			var g UserGrowth
			growthRows.Scan(&g.Month, &g.Count)
			d.UserGrowth = append(d.UserGrowth, g)
		}
	}
	if d.UserGrowth == nil {
		d.UserGrowth = []UserGrowth{}
	}
	return &d, nil
}

