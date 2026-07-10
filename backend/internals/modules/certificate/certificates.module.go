package certificate

import (
	"coursehunt-backend/internals/modules/enrollments"
	"database/sql"
)

type CertificateModule struct {
	DB          *sql.DB
	Enrollments *enrollments.EnrollmentsModule
}

func NewCertificateModule(db *sql.DB, enrollments *enrollments.EnrollmentsModule) *CertificateModule {
	return &CertificateModule{
		DB:          db,
		Enrollments: enrollments,
	}
}
