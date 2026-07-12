package feedbacks

import (
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/enrollments"

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
