package quiz

import (
	"coursehunt-backend/internals/modules/courses"
	"coursehunt-backend/internals/modules/enrollments"

	"github.com/jmoiron/sqlx"
)

type QuizModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
	Courses     *courses.CoursesModule
}

func NewQuizModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule, courses *courses.CoursesModule) *QuizModule {
	return &QuizModule{DB: db, Enrollments: enrollments, Courses: courses}
}
