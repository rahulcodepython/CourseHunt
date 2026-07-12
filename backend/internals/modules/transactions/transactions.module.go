package transactions

import (
	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/modules/coupons"
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/enrollments"
	razorpaypkg "coursehunt-backend/internals/pkg/razorpay"

	"github.com/jmoiron/sqlx"
)

type TransactionsModule struct {
	DB          *sqlx.DB
	Coupons     *coupons.CouponsModule
	Courses     *courses.CoursesModule
	Enrollments *enrollments.EnrollmentsModule
	Razorpay    *razorpaypkg.Client
	Config      *config.Config
}

func NewTransactionsModule(
	db *sqlx.DB,
	c *coupons.CouponsModule,
	crs *courses.CoursesModule,
	enr *enrollments.EnrollmentsModule,
	rzp *razorpaypkg.Client,
	cfg *config.Config,
) *TransactionsModule {
	return &TransactionsModule{
		DB:          db,
		Coupons:     c,
		Courses:     crs,
		Enrollments: enr,
		Razorpay:    rzp,
		Config:      cfg,
	}
}
