package discussions

import (
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/enrollments"

	"github.com/jmoiron/sqlx"
)

type DiscussionsModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
	Courses     *courses.CoursesModule
}

func NewDiscussionsModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule, courses *courses.CoursesModule) *DiscussionsModule {
	return &DiscussionsModule{DB: db, Enrollments: enrollments, Courses: courses}
}
