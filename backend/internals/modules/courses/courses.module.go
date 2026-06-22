package courses

import (
	"database/sql"

	"coursehunt-backend/internals/modules/chapters"
	"coursehunt-backend/internals/modules/enrollments"
	"coursehunt-backend/internals/modules/lessons"
)

type CoursesModule struct {
	DB          *sql.DB
	Chapters    *chapters.ChaptersModule
	Lessons     *lessons.LessonsModule
	Enrollments *enrollments.EnrollmentsModule
}

func NewCoursesModule(db *sql.DB, ch *chapters.ChaptersModule, l *lessons.LessonsModule, e *enrollments.EnrollmentsModule) *CoursesModule {
	return &CoursesModule{
		DB:          db,
		Chapters:    ch,
		Lessons:     l,
		Enrollments: e,
	}
}
