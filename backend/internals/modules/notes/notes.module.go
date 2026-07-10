package notes

import (
	"coursehunt-backend/internals/modules/enrollments"
	"database/sql"
)

type NotesModule struct {
	DB          *sql.DB
	Enrollments *enrollments.EnrollmentsModule
}

func NewNotesModule(db *sql.DB, enrollments *enrollments.EnrollmentsModule) *NotesModule {
	return &NotesModule{DB: db, Enrollments: enrollments}
}
