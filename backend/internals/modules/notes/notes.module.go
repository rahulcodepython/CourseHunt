package notes

import (
	"database/sql"
)

type NotesModule struct {
	DB *sql.DB
}

func NewNotesModule(db *sql.DB) *NotesModule {
	return &NotesModule{DB: db}
}
