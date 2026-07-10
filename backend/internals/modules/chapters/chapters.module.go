package chapters

import (
	"coursehunt-backend/internals/modules/courses"
	"database/sql"
)

type ChaptersModule struct {
	DB      *sql.DB
	Courses *courses.CoursesModule
}

func NewChaptersModule(db *sql.DB, courses *courses.CoursesModule) *ChaptersModule {
	return &ChaptersModule{DB: db, Courses: courses}
}
