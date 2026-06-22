package dashboard

import (
	"database/sql"
)

type DashboardModule struct {
	DB *sql.DB
}

func NewDashboardModule(db *sql.DB) *DashboardModule {
	return &DashboardModule{DB: db}
}
