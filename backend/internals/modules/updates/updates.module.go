package updates

import (
	"database/sql"
)

type UpdatesModule struct {
	DB *sql.DB
}

func NewUpdatesModule(db *sql.DB) *UpdatesModule {
	return &UpdatesModule{DB: db}
}
