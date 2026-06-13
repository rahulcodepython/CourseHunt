package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type TransactionService struct {
	Transactions *repositories.TransactionRepository
	Users        *repositories.UserRepository
	Courses      *repositories.CourseRepository
	Coupons      *repositories.CouponRepository
}

func NewTransactionService() *TransactionService {
	return &TransactionService{
		Transactions: repositories.NewTransactionRepository(),
		Users:        repositories.NewUserRepository(),
		Courses:      repositories.NewCourseRepository(),
		Coupons:      repositories.NewCouponRepository(),
	}
}

func (s *TransactionService) ListAdmin() ([]models.Transaction, error) {
	return s.Transactions.List(true, "")
}

func (s *TransactionService) ListUser(userID string) ([]models.Transaction, error) {
	return s.Transactions.List(false, userID)
}

func (s *TransactionService) Checkout(userID string, courseID int) (models.CheckoutResponse, error) {
	user, err := s.Users.FindByID(userID)
	if err != nil {
		return models.CheckoutResponse{}, err
	}
	course, err := s.Courses.FindByID(courseID)
	if err != nil {
		return models.CheckoutResponse{}, err
	}
	return models.CheckoutResponse{
		Course: models.CheckoutCourse{
			ID:            course.ID,
			Title:         course.Title,
			Price:         course.Price,
			OriginalPrice: course.OriginalPrice,
			ImageURL:      course.ImageURL,
			Category:      course.Category,
		},
		User: models.CheckoutUser{
			ID:        user.ID,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Email:     user.Email,
			Phone:     user.Phone,
			Address:   user.Address,
			City:      user.City,
			Country:   user.Country,
			Zip:       user.Zip,
		},
	}, nil
}

func (s *TransactionService) Purchase(userID string, courseID int, couponID *int, price float64, userUpdate *models.User) (*models.Transaction, error) {
	user, err := s.Users.FindByID(userID)
	if err != nil {
		return nil, err
	}
	course, err := s.Courses.FindByID(courseID)
	if err != nil {
		return nil, err
	}
	var coupon *models.Coupon
	if couponID != nil {
		coupon, err = s.Coupons.FindByID(*couponID)
		if err != nil {
			return nil, err
		}
	}
	return s.Transactions.Purchase(user, course, coupon, price, userUpdate)
}

func (s *TransactionService) GetStatsAdmin() (*repositories.TransactionStats, error) {
	return s.Transactions.GetStats()
}

func (s *TransactionService) InitiateRefund(id int) error {
	return s.Transactions.UpdateStatus(id, "pending")
}

func (s *TransactionService) AcceptRefund(id int) error {
	tx, err := s.Transactions.FindByID(id)
	if err != nil {
		return err
	}
	if err := s.Transactions.UpdateStatus(id, "refunded"); err != nil {
		return err
	}
	// Revoke access
	if tx.UserID != "" && tx.CourseID != 0 {
		_, _ = s.Transactions.DB.Exec(`DELETE FROM course_records WHERE user_id = $1 AND course_id = $2`, tx.UserID, tx.CourseID)
		_, _ = s.Transactions.DB.Exec(`DELETE FROM course_enrollments WHERE user_id = $1 AND course_id = $2`, tx.UserID, tx.CourseID)
	}
	return nil
}

func (s *TransactionService) RejectRefund(id int) error {
	return s.Transactions.UpdateStatus(id, "idle")
}
