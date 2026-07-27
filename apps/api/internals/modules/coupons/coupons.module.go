package coupons

import (
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type CouponsModule struct {
	DB      *sqlx.DB
	Courses *courses.CoursesModule
	Cache   *cache.Cache
}

func NewCouponsModule(db *sqlx.DB, courses *courses.CoursesModule, cache *cache.Cache) *CouponsModule {
	return &CouponsModule{DB: db, Courses: courses, Cache: cache}
}
