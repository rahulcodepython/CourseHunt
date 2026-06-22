package lessons

import (
	"database/sql"

	"coursehunt-backend/internals/modules/enrollments"
	"coursehunt-backend/internals/modules/notes"
	"coursehunt-backend/internals/modules/quiz"
)

type LessonsModule struct {
	DB          *sql.DB
	Enrollments *enrollments.EnrollmentsModule
	Notes       *notes.NotesModule
	Quiz        *quiz.QuizModule
}

func NewLessonsModule(db *sql.DB, enr *enrollments.EnrollmentsModule, n *notes.NotesModule, q *quiz.QuizModule) *LessonsModule {
	return &LessonsModule{
		DB:          db,
		Enrollments: enr,
		Notes:       n,
		Quiz:        q,
	}
}
