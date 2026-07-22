package roles

import "github.com/jmoiron/sqlx"

type RolesModule struct {
	DB *sqlx.DB
}

func NewRolesModule(db *sqlx.DB) *RolesModule {
	return &RolesModule{DB: db}
}
