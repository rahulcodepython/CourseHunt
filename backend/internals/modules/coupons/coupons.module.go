package coupons

import (
	"database/sql"
)

type CouponsModule struct {
	DB *sql.DB
}

func NewCouponsModule(db *sql.DB) *CouponsModule {
	return &CouponsModule{DB: db}
}
