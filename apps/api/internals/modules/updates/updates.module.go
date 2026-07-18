package updates

import (
	"github.com/jmoiron/sqlx"
)

type UpdatesModule struct {
	DB *sqlx.DB
}

func NewUpdatesModule(db *sqlx.DB) *UpdatesModule {
	return &UpdatesModule{DB: db}
}
