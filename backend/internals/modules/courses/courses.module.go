package courses

import (
	"database/sql"
)

type CoursesModule struct {
	DB *sql.DB
}

func NewCoursesModule(db *sql.DB) *CoursesModule {
	return &CoursesModule{
		DB: db,
	}
}
