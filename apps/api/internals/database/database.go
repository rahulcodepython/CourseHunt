package database

// ── Migration Convention ──────────────────────────────────────────────────
//
// Files 000–009 define the initial schema (split per table for readability).
// Once applied, these files must NEVER be edited — the tracking table
// `schema_migrations` will skip them on subsequent starts.
//
// ── Adding an alteration ──────────────────────────────────────────────────
//
// To alter the schema after initial deployment, create a NEW file with the
// next available flat number (010, 011, …) and a descriptive name:
//
//	010_add_discount_to_courses.sql
//	011_add_unique_index_on_slug.sql
//
// Only new (unapplied) files execute.  Old files are immutable.
// ──────────────────────────────────────────────────────────────────────────

import (
	"context"
	"database/sql"
	"io/fs"
	"log"
	"sort"
	"strings"
	"time"

	"coursehunt/api/internals/config"
	"coursehunt/api/internals/migrations"

	_ "github.com/lib/pq"
)

func Connect(cfg *config.Config) *sql.DB {
	db, err := sql.Open("postgres", cfg.DatabaseURL)
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

func runMigrations(db *sql.DB) {
	ensureMigrationTable(db)

	entries, err := fs.ReadDir(migrations.FS, ".")
	if err != nil {
		log.Fatalf("Failed to read migrations: %v", err)
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}

		if alreadyApplied(ctx, db, e.Name()) {
			continue
		}

		content, err := migrations.FS.ReadFile(e.Name())
		if err != nil {
			log.Fatalf("Failed to read migration %s: %v", e.Name(), err)
		}

		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			log.Fatalf("Failed to begin transaction for %s: %v", e.Name(), err)
		}

		if _, err = tx.Exec(string(content)); err != nil {
			tx.Rollback()
			log.Fatalf("Failed to execute migration %s: %v", e.Name(), err)
		}

		if _, err = tx.Exec(`INSERT INTO schema_migrations (filename) VALUES ($1)`, e.Name()); err != nil {
			tx.Rollback()
			log.Fatalf("Failed to record migration %s: %v", e.Name(), err)
		}

		if err = tx.Commit(); err != nil {
			log.Fatalf("Failed to commit migration %s: %v", e.Name(), err)
		}

		log.Printf("[db] Migration applied: %s", e.Name())
	}

	log.Println("[db] All migrations complete")
}

func ensureMigrationTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename  text PRIMARY KEY,
			applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create schema_migrations table: %v", err)
	}
}

func alreadyApplied(ctx context.Context, db *sql.DB, filename string) bool {
	var count int
	err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM schema_migrations WHERE filename = $1`, filename).Scan(&count)
	if err != nil {
		log.Printf("[db] Warning: could not check migration status for %s: %v", filename, err)
		return false
	}
	return count > 0
}

func Close(db *sql.DB) {
	if err := db.Close(); err != nil {
		log.Printf("[db] close error: %v", err)
	}
}
