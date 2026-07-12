package dashboard

import (
	"encoding/json"
)

func (m *DashboardModule) UserDashboardRepository(userID string) (*UserDashboard, error) {
	var d UserDashboard
	var jsonData []byte

	query := `
		SELECT json_build_object(
			'enrolled_courses_count', (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND revoked = false),
			'completed_courses_count', (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND revoked = false AND completed = true),
			'certificates_count', (SELECT COUNT(*) FROM certificates WHERE user_id = $1),
			'recent_courses', COALESCE((
				SELECT json_agg(rc) FROM (
					SELECT c.id, c.slug, c.title, c.image_url, e.completion_percent
					FROM enrollments e
					JOIN courses c ON c.id = e.course_id
					WHERE e.user_id = $1 AND e.revoked = false
					ORDER BY e.enrolled_at DESC LIMIT 5
				) rc
			), '[]'::json),
			'recent_certificates', COALESCE((
				SELECT json_agg(cert_rows) FROM (
					SELECT c.title AS course_title, cert.issued_at
					FROM certificates cert
					JOIN courses c ON c.id = cert.course_id
					WHERE cert.user_id = $1
					ORDER BY cert.issued_at DESC LIMIT 5
				) cert_rows
			), '[]'::json)
		)`

	if err := m.DB.Get(&jsonData, query, userID); err != nil {
		return nil, err
	}

	if err := json.Unmarshal(jsonData, &d); err != nil {
		return nil, err
	}

	d.InProgressCoursesCount = d.EnrolledCoursesCount - d.CompletedCoursesCount
	return &d, nil
}

func (m *DashboardModule) TutorDashboardRepository(tutorID string) (*TutorDashboard, error) {
	var d TutorDashboard
	var jsonData []byte

	query := `
		SELECT json_build_object(
			'total_courses', (SELECT COUNT(*) FROM courses WHERE tutor_id = $1),
			'published_courses', (SELECT COUNT(*) FROM courses WHERE tutor_id = $1 AND status = 'published'),
			'total_students', COALESCE((SELECT total_students FROM tutor_profile WHERE user_id = $1), 0),
			'rating_avg', COALESCE((SELECT rating_avg FROM tutor_profile WHERE user_id = $1), 0.0),
			'total_revenue', COALESCE((
				SELECT SUM(t.amount) FROM transactions t
				JOIN courses c ON c.id = t.course_id
				WHERE c.tutor_id = $1 AND t.status = 'success'
			), 0.0),
			'recent_transactions', COALESCE((
				SELECT json_agg(tx_rows) FROM (
					SELECT u.name AS user_name, c.title AS course_title, t.amount, t.created_at AS date
					FROM transactions t
					JOIN "user" u ON u.id = t.user_id
					JOIN courses c ON c.id = t.course_id
					WHERE c.tutor_id = $1 AND t.status = 'success'
					ORDER BY t.created_at DESC LIMIT 10
				) tx_rows
			), '[]'::json),
			'course_stats', COALESCE((
				SELECT json_agg(stats_rows) FROM (
					SELECT c.id AS course_id, c.title,
					       COUNT(DISTINCT e.user_id) AS students,
					       COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0.0) AS revenue
					FROM courses c
					LEFT JOIN enrollments e ON e.course_id = c.id
					LEFT JOIN transactions t ON t.course_id = c.id
					WHERE c.tutor_id = $1
					GROUP BY c.id, c.title
					ORDER BY revenue DESC
				) stats_rows
			), '[]'::json)
		)`

	if err := m.DB.Get(&jsonData, query, tutorID); err != nil {
		return nil, err
	}

	if err := json.Unmarshal(jsonData, &d); err != nil {
		return nil, err
	}

	d.DraftCourses = d.TotalCourses - d.PublishedCourses
	return &d, nil
}

func (m *DashboardModule) AdminDashboardRepository() (*AdminDashboard, error) {
	var d AdminDashboard
	var jsonData []byte

	query := `
		SELECT json_build_object(
			'total_users', (SELECT COUNT(*) FROM "user"),
			'total_tutors', (
				SELECT COUNT(DISTINCT ur.user_id)
				FROM user_roles ur
				JOIN roles ro ON ro.id = ur.role_id
				WHERE ro.name = 'tutor'
			),
			'total_courses', (SELECT COUNT(*) FROM courses),
			'total_enrollments', (SELECT COUNT(*) FROM enrollments),
			'total_revenue', COALESCE((SELECT SUM(amount) FROM transactions WHERE status = 'success'), 0.0),
			'revenue_this_month', COALESCE((
				SELECT SUM(amount) FROM transactions
				WHERE status = 'success' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
			), 0.0),
			'recent_transactions', COALESCE((
				SELECT json_agg(tx_rows) FROM (
					SELECT id, user_id, course_id, amount, status, created_at
					FROM transactions
					ORDER BY created_at DESC LIMIT 20
				) tx_rows
			), '[]'::json),
			'top_courses', COALESCE((
				SELECT json_agg(top_rows) FROM (
					SELECT c.title, COUNT(DISTINCT e.user_id) AS students, COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0.0) AS revenue
					FROM courses c
					LEFT JOIN enrollments e ON e.course_id = c.id
					LEFT JOIN transactions t ON t.course_id = c.id
					GROUP BY c.id, c.title
					ORDER BY revenue DESC LIMIT 10
				) top_rows
			), '[]'::json),
			'user_growth', COALESCE((
				SELECT json_agg(growth_rows) FROM (
					SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*) AS count
					FROM "user"
					WHERE "createdAt" >= CURRENT_DATE - INTERVAL '12 months'
					GROUP BY month ORDER BY month
				) growth_rows
			), '[]'::json)
		)`

	if err := m.DB.Get(&jsonData, query); err != nil {
		return nil, err
	}

	if err := json.Unmarshal(jsonData, &d); err != nil {
		return nil, err
	}

	return &d, nil
}
