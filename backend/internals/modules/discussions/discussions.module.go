package discussions

import (
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/enrollments"
	"database/sql"
)

type DiscussionsModule struct {
	DB          *sql.DB
	Enrollments *enrollments.EnrollmentsModule
	Courses     *courses.CoursesModule
}

func NewDiscussionsModule(db *sql.DB, enrollments *enrollments.EnrollmentsModule, courses *courses.CoursesModule) *DiscussionsModule {
	return &DiscussionsModule{DB: db, Enrollments: enrollments, Courses: courses}
}
