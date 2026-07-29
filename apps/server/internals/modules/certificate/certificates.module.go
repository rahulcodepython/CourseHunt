package certificate

import (
	"coursehunt/api/internals/modules/enrollments"

	"github.com/jmoiron/sqlx"
)

type CertificateModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
}

func NewCertificateModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule) *CertificateModule {
	return &CertificateModule{
		DB:          db,
		Enrollments: enrollments,
	}
}
