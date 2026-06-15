package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type DashboardService struct {
	Dashboard *repositories.DashboardRepository
	Users     *repositories.UserRepository
	Courses   *repositories.CourseRepository
	Study     *repositories.StudyRepository
}

func NewDashboardService() *DashboardService {
	return &DashboardService{
		Dashboard: repositories.NewDashboardRepository(),
		Users:     repositories.NewUserRepository(),
		Courses:   repositories.NewCourseRepository(),
		Study:     repositories.NewStudyRepository(),
	}
}

func (s *DashboardService) Admin() (models.AdminDashboardResponse, error) {
	students, err := s.Users.List()
	if err != nil {
		return models.AdminDashboardResponse{}, err
	}
	courses, err := s.Courses.Summaries(true, 0, "", false)
	if err != nil {
		return models.AdminDashboardResponse{}, err
	}
	stats, err := s.Dashboard.Stats()
	if err != nil {
		return models.AdminDashboardResponse{}, err
	}

	serializedStudents := make([]models.UserResponse, len(students))
	for i, student := range students {
		serializedStudents[i] = student.ToResponse()
	}

	return models.AdminDashboardResponse{
		Students:         serializedStudents,
		ActiveCourses:    courses,
		TotalUsers:       stats.TotalUsers,
		TotalCourses:     stats.TotalCourses,
		TotalRevenue:     stats.TotalRevenue,
		TotalEnrollments: stats.TotalEnrollments,
	}, nil
}

func (s *DashboardService) User(userID string) (models.UserDashboardResponse, error) {
	user, err := s.Users.FindByID(userID)
	if err != nil {
		return models.UserDashboardResponse{}, err
	}
	courses, err := s.Study.UserCourses(user.ID, true)
	if err != nil {
		return models.UserDashboardResponse{}, err
	}
	return models.UserDashboardResponse{
		User:            models.UserDashboardInfo{Name: user.Name},
		Courses:         courses,
		EnrolledCourses: user.PurchasedCourses,
	}, nil
}
