package quiz

import (
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/modules/enrollments"

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
