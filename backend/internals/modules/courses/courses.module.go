package courses

import (
	"coursehunt-backend/internals/modules/enrollments"

	"github.com/jmoiron/sqlx"
)

type CoursesModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
}

func NewCoursesModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule) *CoursesModule {
	return &CoursesModule{
		DB:          db,
		Enrollments: enrollments,
	}
}
