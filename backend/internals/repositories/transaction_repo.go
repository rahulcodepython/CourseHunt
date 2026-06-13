package repositories

import (
	"database/sql"
	"errors"
	"time"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
	"github.com/google/uuid"
)

type TransactionRepository struct {
	DB *sql.DB
}

func NewTransactionRepository() *TransactionRepository {
	return &TransactionRepository{DB: database.DB}
}

func (r *TransactionRepository) List(admin bool, userID string) ([]models.Transaction, error) {
	query := `SELECT id, transaction_id, created_at, COALESCE(course_id,0), course_name, COALESCE(user_id,''), user_email, coupon_id, COALESCE(coupon_code,''), amount, COALESCE(status, 'idle') FROM transactions`
	args := []interface{}{}
	if !admin {
		query += ` WHERE user_id = $1`
		args = append(args, userID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := []models.Transaction{}
	for rows.Next() {
		var transaction models.Transaction
		if err := rows.Scan(&transaction.ID, &transaction.TransactionID, &transaction.CreatedAt, &transaction.CourseID, &transaction.CourseName, &transaction.UserID, &transaction.UserEmail, &transaction.CouponID, &transaction.CouponCode, &transaction.Amount, &transaction.Status); err != nil {
			return nil, err
		}
		transaction.LegacyID = transaction.ID
		transactions = append(transactions, transaction)
	}
	return transactions, rows.Err()
}

func (r *TransactionRepository) Purchase(user *models.User, course *models.CourseDetail, coupon *models.Coupon, price float64, userUpdate *models.User) (*models.Transaction, error) {
	var exists int
	if err := r.DB.QueryRow(`SELECT COUNT(1) FROM course_records WHERE user_id = $1 AND course_id = $2`, user.ID, course.ID).Scan(&exists); err != nil {
		return nil, err
	}
	if exists > 0 {
		return nil, errors.New("You have already purchased this course")
	}

	var couponID *int
	var couponCode string
	if coupon != nil {
		if !coupon.IsActive || coupon.Usage >= coupon.MaxUsage || time.Now().After(coupon.ExpiryDate) {
			return nil, errors.New("Coupon is not valid")
		}
		couponID = &coupon.ID
		couponCode = coupon.Code
	}

	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	transactionID := "txn_" + uuid.NewString()
	var transaction models.Transaction
	err = tx.QueryRow(`
		INSERT INTO transactions(transaction_id, course_id, course_name, user_id, user_email, coupon_id, coupon_code, amount, status)
		VALUES($1, $2, $3, $4, $5, $6, $7, $8, 'idle')
		RETURNING id, transaction_id, created_at, amount, status
	`, transactionID, course.ID, course.Title, user.ID, user.Email, couponID, couponCode, price).Scan(&transaction.ID, &transaction.TransactionID, &transaction.CreatedAt, &transaction.Amount, &transaction.Status)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(`
		UPDATE profiles
		SET first_name = COALESCE(NULLIF($1,''), first_name),
			last_name = COALESCE(NULLIF($2,''), last_name),
			phone = COALESCE(NULLIF($3,''), phone),
			address = COALESCE(NULLIF($4,''), address),
			city = COALESCE(NULLIF($5,''), city),
			zip = COALESCE(NULLIF($6,''), zip),
			country = COALESCE(NULLIF($7,''), country)
		WHERE user_id = $8
	`, userUpdate.FirstName, userUpdate.LastName, userUpdate.Phone, userUpdate.Address, userUpdate.City, userUpdate.Zip, userUpdate.Country, user.ID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(`INSERT INTO course_records(user_id, course_id) VALUES($1, $2)`, user.ID, course.ID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(`INSERT INTO course_enrollments(user_id, course_id, user_email) VALUES($1, $2, $3)`, user.ID, course.ID, user.Email); err != nil {
		return nil, err
	}
	if couponID != nil {
		if _, err := tx.Exec(`UPDATE coupons SET usage = usage + 1 WHERE id = $1`, *couponID); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	transaction.LegacyID = transaction.ID
	transaction.CourseID = course.ID
	transaction.CourseName = course.Title
	transaction.UserID = user.ID
	transaction.UserEmail = user.Email
	transaction.CouponID = couponID
	transaction.CouponCode = couponCode
	return &transaction, nil
}

func (r *TransactionRepository) UpdateStatus(id int, status string) error {
	_, err := r.DB.Exec(`UPDATE transactions SET status = $1 WHERE id = $2`, status, id)
	return err
}

type TransactionStats struct {
	TotalRevenue   float64 `json:"totalRevenue"`
	RevenueThisMonth float64 `json:"revenueThisMonth"`
	TotalRefunds   int     `json:"totalRefunds"`
	PendingRefunds int     `json:"pendingRefunds"`
}

func (r *TransactionRepository) GetStats() (*TransactionStats, error) {
	var stats TransactionStats
	err := r.DB.QueryRow(`
		SELECT 
			COALESCE(SUM(amount) FILTER (WHERE status != 'refunded'), 0) as total_revenue,
			COALESCE(SUM(amount) FILTER (WHERE status != 'refunded' AND created_at >= date_trunc('month', current_date)), 0) as revenue_this_month,
			COUNT(1) FILTER (WHERE status = 'refunded') as total_refunds,
			COUNT(1) FILTER (WHERE status = 'pending') as pending_refunds
		FROM transactions
	`).Scan(&stats.TotalRevenue, &stats.RevenueThisMonth, &stats.TotalRefunds, &stats.PendingRefunds)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func (r *TransactionRepository) FindByID(id int) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.DB.QueryRow(`
		SELECT id, transaction_id, created_at, COALESCE(course_id,0), course_name, COALESCE(user_id,''), user_email, coupon_id, COALESCE(coupon_code,''), amount, COALESCE(status, 'idle') 
		FROM transactions WHERE id = $1
	`, id).Scan(&transaction.ID, &transaction.TransactionID, &transaction.CreatedAt, &transaction.CourseID, &transaction.CourseName, &transaction.UserID, &transaction.UserEmail, &transaction.CouponID, &transaction.CouponCode, &transaction.Amount, &transaction.Status)
	if err != nil {
		return nil, err
	}
	transaction.LegacyID = transaction.ID
	return &transaction, nil
}
