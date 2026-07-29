package chapters

import (
	"coursehunt/api/internals/modules/courses"
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type ChaptersModule struct {
	DB      *sqlx.DB
	Courses *courses.CoursesModule
	Cache   *cache.Cache
}

func NewChaptersModule(db *sqlx.DB, courses *courses.CoursesModule, cache *cache.Cache) *ChaptersModule {
	return &ChaptersModule{DB: db, Courses: courses, Cache: cache}
}
