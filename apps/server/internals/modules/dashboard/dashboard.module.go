package dashboard

import (
	"github.com/jmoiron/sqlx"
)

type DashboardModule struct {
	DB *sqlx.DB
}

func NewDashboardModule(db *sqlx.DB) *DashboardModule {
	return &DashboardModule{DB: db}
}
