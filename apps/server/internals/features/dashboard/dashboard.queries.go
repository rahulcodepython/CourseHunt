package dashboard

const (
	UserDashboardJSON = `
		SELECT jsonb_build_object(
			'enrolled_courses_count', (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND revoked = false),
			'completed_courses_count', (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND revoked = false AND completed = true),
			'certificates_count', (SELECT COUNT(*) FROM certificates WHERE user_id = $1),
			'recent_certificates', COALESCE((
				SELECT jsonb_agg(cert_rows) FROM (
					SELECT c.title AS course_title, cert.issued_at
					FROM certificates cert
					JOIN courses c ON c.id = cert.course_id
					WHERE cert.user_id = $1
					ORDER BY cert.issued_at DESC LIMIT 5
				) cert_rows
			), '[]'::jsonb)
		);
	`

	TutorDashboardJSON = `
		SELECT jsonb_build_object(
			'total_courses', (SELECT COUNT(*) FROM courses WHERE tutor_id = $1),
			'published_courses', (SELECT COUNT(*) FROM courses WHERE tutor_id = $1 AND status = 'published'),
			'total_students', COALESCE((SELECT total_students FROM profiles WHERE user_id = $1), 0),
			'rating_avg', COALESCE((SELECT rating_avg FROM profiles WHERE user_id = $1), 0.0),
			'total_revenue', COALESCE((
				SELECT SUM(t.amount) FROM transactions t
				JOIN courses c ON c.id = t.course_id
				WHERE c.tutor_id = $1 AND t.status = 'success'
			), 0.0),
			'course_stats', COALESCE((
				SELECT jsonb_agg(stats_rows) FROM (
					SELECT c.id AS course_id, c.title,
					       COUNT(DISTINCT e.user_id) AS students
					FROM courses c
					LEFT JOIN enrollments e ON e.course_id = c.id
					WHERE c.tutor_id = $1
					GROUP BY c.id, c.title
					ORDER BY students DESC
				) stats_rows
			), '[]'::jsonb)
		);
	`

	AdminDashboardJSON = `
		SELECT jsonb_build_object(
			'total_users', (SELECT COUNT(*) FROM "users"),
			'total_tutors', (
				SELECT COUNT(DISTINCT ur.user_id)
				FROM roles_user ur
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
				SELECT jsonb_agg(tx_rows) FROM (
					SELECT id, user_id, course_id, amount, status, created_at
					FROM transactions
					ORDER BY created_at DESC LIMIT 20
				) tx_rows
			), '[]'::jsonb),
			'top_courses', COALESCE((
				SELECT jsonb_agg(top_rows) FROM (
					SELECT c.title, COUNT(DISTINCT e.user_id) AS students, COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0.0) AS revenue
					FROM courses c
					LEFT JOIN enrollments e ON e.course_id = c.id
					LEFT JOIN transactions t ON t.course_id = c.id
					GROUP BY c.id, c.title
					ORDER BY revenue DESC LIMIT 10
				) top_rows
			), '[]'::jsonb),
			'user_growth', COALESCE((
				SELECT jsonb_agg(growth_rows) FROM (
					SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month, COUNT(*) AS count
					FROM "users"
					WHERE "createdAt" >= CURRENT_DATE - INTERVAL '12 months'
					GROUP BY month ORDER BY month
				) growth_rows
			), '[]'::jsonb)
		);
	`
)
