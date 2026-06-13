package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type CouponRepository struct {
	DB *sql.DB
}

func NewCouponRepository() *CouponRepository {
	return &CouponRepository{DB: database.DB}
}

func (r *CouponRepository) List() ([]models.Coupon, error) {
	rows, err := r.DB.Query(`SELECT id, code, expiry_date, COALESCE(usage,0), max_usage, offer_value, COALESCE(is_active,true), COALESCE(description,'') FROM coupons ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	coupons := []models.Coupon{}
	for rows.Next() {
		var coupon models.Coupon
		if err := rows.Scan(&coupon.ID, &coupon.Code, &coupon.ExpiryDate, &coupon.Usage, &coupon.MaxUsage, &coupon.OfferValue, &coupon.IsActive, &coupon.Description); err != nil {
			return nil, err
		}
		coupon.LegacyID = coupon.ID
		coupons = append(coupons, coupon)
	}
	return coupons, rows.Err()
}

func (r *CouponRepository) FindByID(id int) (*models.Coupon, error) {
	row := r.DB.QueryRow(`SELECT id, code, expiry_date, COALESCE(usage,0), max_usage, offer_value, COALESCE(is_active,true), COALESCE(description,'') FROM coupons WHERE id = $1`, id)
	var coupon models.Coupon
	if err := row.Scan(&coupon.ID, &coupon.Code, &coupon.ExpiryDate, &coupon.Usage, &coupon.MaxUsage, &coupon.OfferValue, &coupon.IsActive, &coupon.Description); err != nil {
		return nil, err
	}
	coupon.LegacyID = coupon.ID
	return &coupon, nil
}

func (r *CouponRepository) FindByCode(code string) (*models.Coupon, error) {
	row := r.DB.QueryRow(`SELECT id, code, expiry_date, COALESCE(usage,0), max_usage, offer_value, COALESCE(is_active,true), COALESCE(description,'') FROM coupons WHERE code = $1`, code)
	var coupon models.Coupon
	if err := row.Scan(&coupon.ID, &coupon.Code, &coupon.ExpiryDate, &coupon.Usage, &coupon.MaxUsage, &coupon.OfferValue, &coupon.IsActive, &coupon.Description); err != nil {
		return nil, err
	}
	coupon.LegacyID = coupon.ID
	return &coupon, nil
}

func (r *CouponRepository) Create(coupon *models.Coupon) (*models.Coupon, error) {
	err := r.DB.QueryRow(`INSERT INTO coupons(code, expiry_date, usage, max_usage, offer_value, is_active, description) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id`, coupon.Code, coupon.ExpiryDate, coupon.Usage, coupon.MaxUsage, coupon.OfferValue, coupon.IsActive, coupon.Description).Scan(&coupon.ID)
	coupon.LegacyID = coupon.ID
	return coupon, err
}

func (r *CouponRepository) Update(id int, coupon *models.Coupon) (*models.Coupon, error) {
	_, err := r.DB.Exec(`UPDATE coupons SET code = COALESCE(NULLIF($1,''), code), expiry_date = COALESCE($2, expiry_date), usage = $3, max_usage = $4, offer_value = $5, is_active = $6, description = $7 WHERE id = $8`, coupon.Code, coupon.ExpiryDate, coupon.Usage, coupon.MaxUsage, coupon.OfferValue, coupon.IsActive, coupon.Description, id)
	if err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *CouponRepository) Delete(id int) error {
	_, err := r.DB.Exec(`DELETE FROM coupons WHERE id = $1`, id)
	return err
}
