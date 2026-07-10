package feedbacks

import (
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/enrollments"
	"database/sql"
)

type FeedbacksModule struct {
	DB          *sql.DB
	Enrollments *enrollments.EnrollmentsModule
	Courses     *courses.CoursesModule
}

func NewFeedbacksModule(db *sql.DB, enrollments *enrollments.EnrollmentsModule, courses *courses.CoursesModule) *FeedbacksModule {
	return &FeedbacksModule{DB: db, Enrollments: enrollments, Courses: courses}
}
