package coupons

import (
	"coursehunt/api/internals/modules/courses"

	"github.com/jmoiron/sqlx"
)

type CouponsModule struct {
	DB      *sqlx.DB
	Courses *courses.CoursesModule
}

func NewCouponsModule(db *sqlx.DB, courses *courses.CoursesModule) *CouponsModule {
	return &CouponsModule{DB: db, Courses: courses}
}
