package transactions

import (
	"coursehunt/api/internals/config"
	"coursehunt/api/internals/modules/coupons"
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/modules/enrollments"
	razorpaypkg "coursehunt/api/internals/pkg/razorpay"

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
