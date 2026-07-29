package notes

import (
	"coursehunt/api/internals/modules/enrollments"
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type NotesModule struct {
	DB          *sqlx.DB
	Enrollments *enrollments.EnrollmentsModule
	Cache       *cache.Cache
}

func NewNotesModule(db *sqlx.DB, enrollments *enrollments.EnrollmentsModule, cache *cache.Cache) *NotesModule {
	return &NotesModule{DB: db, Enrollments: enrollments, Cache: cache}
}
