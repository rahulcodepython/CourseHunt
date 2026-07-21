package dashboard

import "time"

// ── User Dashboard ─────────────────────────────────────────────────────────────

type RecentCertificate struct {
	CourseTitle string    `json:"course_title"`
	IssuedAt    time.Time `json:"issued_at"`
}

type UserDashboard struct {
	EnrolledCoursesCount   int                 `json:"enrolled_courses_count"`
	CompletedCoursesCount  int                 `json:"completed_courses_count"`
	InProgressCoursesCount int                 `json:"in_progress_courses_count"`
	CertificatesCount      int                 `json:"certificates_count"`
	RecentCertificates     []RecentCertificate `json:"recent_certificates"`
}

// ── Tutor Dashboard ────────────────────────────────────────────────────────────

type TutorRecentTransaction struct {
	UserName    string    `json:"user_name"`
	CourseTitle string    `json:"course_title"`
	Amount      float64   `json:"amount"`
	Date        time.Time `json:"date"`
}

type TutorCourseStat struct {
	CourseID string `json:"course_id"`
	Title    string `json:"title"`
	Students int    `json:"students"`
}

type TutorDashboard struct {
	TotalCourses     int               `json:"total_courses"`
	PublishedCourses int               `json:"published_courses"`
	DraftCourses     int               `json:"draft_courses"`
	TotalStudents    int               `json:"total_students"`
	TotalRevenue     float64           `json:"total_revenue"`
	RatingAvg        float64           `json:"rating_avg"`
	CourseStats      []TutorCourseStat `json:"course_stats"`
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────

type AdminRecentTransaction struct {
	ID        string    `json:"id"`
	UserID    *string   `json:"user_id"`
	CourseID  *string   `json:"course_id"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type AdminTopCourse struct {
	Title    string  `json:"title"`
	Students int     `json:"students"`
	Revenue  float64 `json:"revenue"`
}

type UserGrowth struct {
	Month string `json:"month"`
	Count int    `json:"count"`
}

type AdminDashboard struct {
	TotalUsers         int                      `json:"total_users"`
	TotalTutors        int                      `json:"total_tutors"`
	TotalCourses       int                      `json:"total_courses"`
	TotalEnrollments   int                      `json:"total_enrollments"`
	TotalRevenue       float64                  `json:"total_revenue"`
	RevenueThisMonth   float64                  `json:"revenue_this_month"`
	RecentTransactions []AdminRecentTransaction `json:"recent_transactions"`
	TopCourses         []AdminTopCourse         `json:"top_courses"`
	UserGrowth         []UserGrowth             `json:"user_growth"`
}
