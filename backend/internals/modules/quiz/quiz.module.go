package quiz

import (
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/enrollments"
	"database/sql"
)

type QuizModule struct {
	DB          *sql.DB
	Enrollments *enrollments.EnrollmentsModule
	Courses     *courses.CoursesModule
}

func NewQuizModule(db *sql.DB, enrollments *enrollments.EnrollmentsModule, courses *courses.CoursesModule) *QuizModule {
	return &QuizModule{DB: db, Enrollments: enrollments, Courses: courses}
}
