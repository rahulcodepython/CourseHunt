package feedbacks

import (
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/modules/enrollments"
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type FeedbacksModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
	Courses     *courses.CoursesModule
	Cache       *cache.Cache
}

func NewFeedbacksModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule, courses *courses.CoursesModule, cache *cache.Cache) *FeedbacksModule {
	return &FeedbacksModule{DB: db, Enrollments: enrollments, Courses: courses, Cache: cache}
}
