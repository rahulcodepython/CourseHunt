package certificates

import (
	"time"

	"coursehunt/server/internals/generic"
)

type Certificate struct {
	ID       string                 `json:"id" db:"id"`
	UserID   string                 `json:"user_id" db:"user_id"`
	Course   generic.CourseInfo     `json:"course" db:"course"`
	Tutor    generic.InstructorInfo `json:"tutor" db:"tutor"`
	IssuedAt time.Time              `json:"issued_at" db:"issued_at"`
}

// CertificateVerification is the public, unauthenticated response served by
// scanning a certificate's QR code — enough to render a "congratulations"
// card and prove the certificate is legit without exposing anything private.
type CertificateVerification struct {
	Valid    bool                   `json:"valid"`
	ID       string                 `json:"id" db:"id"`
	Student  generic.UserInfo       `json:"student" db:"student"`
	Course   generic.CourseInfo     `json:"course" db:"course"`
	Tutor    generic.InstructorInfo `json:"tutor" db:"tutor"`
	IssuedAt time.Time              `json:"issued_at" db:"issued_at"`
}
