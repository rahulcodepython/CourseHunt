package database

import (
	"database/sql"
	"io/fs"
	"log"
	"sort"
	"strings"

	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/migrations"

	_ "github.com/lib/pq"
)

// Connect replaces init() — takes config, returns db, no globals
func Connect(cfg *config.Config) *sql.DB {
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("[db] Connected to PostgreSQL")
	runMigrations(db) // separate concern
	return db         // returns db, no global var
}

func runMigrations(db *sql.DB) {
	entries, err := fs.ReadDir(migrations.FS, ".")
	if err != nil {
		log.Fatalf("Failed to read migrations: %v", err)
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}

		content, err := migrations.FS.ReadFile(e.Name())
		if err != nil {
			log.Fatalf("Failed to read migration %s: %v", e.Name(), err)
		}

		if _, err = db.Exec(string(content)); err != nil {
			log.Fatalf("Failed to execute migration %s: %v", e.Name(), err)
		}

		log.Printf("[db] Migration applied: %s", e.Name())
	}

	log.Println("[db] All migrations complete")
}

func Close(db *sql.DB) {
	if err := db.Close(); err != nil {
		log.Printf("[db] close error: %v", err)
	}
}
