package courses

import (
	"database/sql"

	"coursehunt-backend/internals/modules/enrollments"
)

type CoursesModule struct {
	DB          *sql.DB
	Enrollments *enrollments.EnrollmentsModule
}

func NewCoursesModule(db *sql.DB, enrollments *enrollments.EnrollmentsModule) *CoursesModule {
	return &CoursesModule{
		DB:          db,
		Enrollments: enrollments,
	}
}
