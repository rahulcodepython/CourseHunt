package chapters

import (
	"coursehunt-backend/internals/modules/courses"

	"github.com/jmoiron/sqlx"
)

type ChaptersModule struct {
	DB      *sqlx.DB
	Courses *courses.CoursesModule
}

func NewChaptersModule(db *sqlx.DB, courses *courses.CoursesModule) *ChaptersModule {
	return &ChaptersModule{DB: db, Courses: courses}
}
