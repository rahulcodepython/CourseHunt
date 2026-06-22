package transactions

import (
	"database/sql"

	"coursehunt-backend/internals/modules/coupons"
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/enrollments"
	razorpaypkg "coursehunt-backend/internals/pkg/razorpay"
)

type TransactionsModule struct {
	DB          *sql.DB
	Coupons     *coupons.CouponsModule
	Courses     *courses.CoursesModule
	Enrollments *enrollments.EnrollmentsModule
	Razorpay    *razorpaypkg.Client
}

func NewTransactionsModule(
	db *sql.DB,
	c *coupons.CouponsModule,
	crs *courses.CoursesModule,
	enr *enrollments.EnrollmentsModule,
	rzp *razorpaypkg.Client,
) *TransactionsModule {
	return &TransactionsModule{
		DB:          db,
		Coupons:     c,
		Courses:     crs,
		Enrollments: enr,
		Razorpay:    rzp,
	}
}
