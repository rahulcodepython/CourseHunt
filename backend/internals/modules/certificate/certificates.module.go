package certificates

import "database/sql"

type CertificateModule struct {
	DB *sql.DB
}

func NewCertificateModule(db *sql.DB) *CertificateModule {
	return &CertificateModule{DB: db}
}
