package lessons

import (
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type LessonsModule struct {
	DB      *sqlx.DB
	Courses *courses.CoursesModule
	Cache   *cache.Cache
}

func NewLessonsModule(db *sqlx.DB, courses *courses.CoursesModule, cache *cache.Cache) *LessonsModule {
	return &LessonsModule{
		DB:      db,
		Courses: courses,
		Cache:   cache,
	}
}
