package notes

import (
	"coursehunt-backend/internals/modules/enrollments"

	"github.com/jmoiron/sqlx"
)

type NotesModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
}

func NewNotesModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule) *NotesModule {
	return &NotesModule{DB: db, Enrollments: enrollments}
}
