package feedbacks

import (
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/modules/enrollments"

	"github.com/jmoiron/sqlx"
)

type FeedbacksModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
	Courses     *courses.CoursesModule
}

func NewFeedbacksModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule, courses *courses.CoursesModule) *FeedbacksModule {
	return &FeedbacksModule{DB: db, Enrollments: enrollments, Courses: courses}
}
