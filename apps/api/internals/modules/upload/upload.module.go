package upload

import (
	"github.com/jmoiron/sqlx"
)

type UploadModule struct {
	DB *sqlx.DB
}

func NewUploadModule(db *sqlx.DB) *UploadModule {
	return &UploadModule{DB: db}
}
