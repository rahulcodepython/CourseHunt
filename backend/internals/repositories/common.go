package repositories

import (
	"database/sql"
)

func stringFromNull(v sql.NullString) string {
	if v.Valid {
		return v.String
	}
	return ""
}
