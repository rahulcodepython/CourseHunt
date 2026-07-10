package lessons

import (
	"coursehunt-backend/internals/modules/courses"
	"database/sql"
)

type LessonsModule struct {
	DB      *sql.DB
	Courses *courses.CoursesModule
}

func NewLessonsModule(db *sql.DB, courses *courses.CoursesModule) *LessonsModule {
	return &LessonsModule{
		DB:      db,
		Courses: courses,
	}
}
