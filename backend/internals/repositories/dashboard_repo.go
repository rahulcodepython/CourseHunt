package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type DashboardRepository struct {
	DB *sql.DB
}

func NewDashboardRepository() *DashboardRepository {
	return &DashboardRepository{DB: database.DB}
}

func (r *DashboardRepository) Stats() (models.DashboardStats, error) {
	var totalUsers, totalCourses, totalEnrollments int
	var totalRevenue float64
	err := r.DB.QueryRow(`SELECT total_users, total_courses, total_revenue, total_enrollments FROM global_stats WHERE id = 1`).Scan(&totalUsers, &totalCourses, &totalRevenue, &totalEnrollments)
	if err != nil {
		return models.DashboardStats{}, err
	}
	return models.DashboardStats{
		TotalUsers:       totalUsers,
		TotalCourses:     totalCourses,
		TotalRevenue:     totalRevenue,
		TotalEnrollments: totalEnrollments,
	}, nil
}

func (r *DashboardRepository) RevenueTotals() (float64, float64, error) {
	var total float64
	err := r.DB.QueryRow(`SELECT total_revenue FROM global_stats WHERE id = 1`).Scan(&total)
	if err == sql.ErrNoRows {
		return 0, 0, nil
	}
	return 0, total, err // monthly is not tracked yet in global_stats
}
