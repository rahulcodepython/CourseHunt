package database

import (
	"log"
	"sort"
	"strings"
	"time"

	"coursehunt/api/internals/config"
	"coursehunt/api/internals/migrations"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func Connect(cfg *config.Config) *sqlx.DB {
	db, err := sqlx.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	db.SetMaxOpenConns(cfg.DBMaxOpenConns)
	db.SetMaxIdleConns(cfg.DBMaxIdleConns)
	db.SetConnMaxLifetime(time.Duration(cfg.DBConnMaxLifetime) * time.Minute)

	if err = db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Printf("[db] Connected to PostgreSQL (pool: %d/%d, max lifetime: %dm)",
		cfg.DBMaxOpenConns, cfg.DBMaxIdleConns, cfg.DBConnMaxLifetime)

	runMigrations(db)

	return db
}

func runMigrations(db *sqlx.DB) {
	entries, err := migrations.FS.ReadDir(".")
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

func Close(db *sqlx.DB) {
	if err := db.Close(); err != nil {
		log.Printf("[db] close error: %v", err)
	}
}
