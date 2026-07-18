package lessons

import (
	"coursehunt/api/internals/modules/courses"

	"github.com/jmoiron/sqlx"
)

type LessonsModule struct {
	DB      *sqlx.DB
	Courses *courses.CoursesModule
}

func NewLessonsModule(db *sqlx.DB, courses *courses.CoursesModule) *LessonsModule {
	return &LessonsModule{
		DB:      db,
		Courses: courses,
	}
}
