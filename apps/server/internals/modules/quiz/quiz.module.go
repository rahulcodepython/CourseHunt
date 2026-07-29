package quiz

import (
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/modules/enrollments"
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type QuizModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
	Courses     *courses.CoursesModule
	Cache       *cache.Cache
}

func NewQuizModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule, courses *courses.CoursesModule, cache *cache.Cache) *QuizModule {
	return &QuizModule{DB: db, Enrollments: enrollments, Courses: courses, Cache: cache}
}
