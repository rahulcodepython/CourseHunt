package courses

import (
	"coursehunt/api/internals/modules/enrollments"
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type CoursesModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
	Cache       *cache.Cache
}

func NewCoursesModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule, cache *cache.Cache) *CoursesModule {
	return &CoursesModule{
		DB:          db,
		Enrollments: enrollments,
		Cache:       cache,
	}
}
