package database

import (
	"log"
	"time"

	"coursehunt/server/internals/config"

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
	db.SetConnMaxIdleTime(time.Duration(cfg.DBConnMaxIdleTime) * time.Minute)

	// docker-compose's own service_healthy gate should already mean Postgres
	// is accepting connections by the time this runs, but retry anyway: a
	// VPS under load, a slow container start, or running this binary outside
	// compose entirely can all still hit a connection race on the first try.
	const maxAttempts = 5
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		if err = db.Ping(); err == nil {
			break
		}
		if attempt == maxAttempts {
			log.Fatalf("Failed to ping database after %d attempts: %v", maxAttempts, err)
		}
		log.Printf("[db] ping attempt %d/%d failed: %v — retrying in 2s", attempt, maxAttempts, err)
		time.Sleep(2 * time.Second)
	}

	log.Printf("[db] Connected to PostgreSQL (pool: %d/%d, max lifetime: %dm, max idle time: %dm)",
		cfg.DBMaxOpenConns, cfg.DBMaxIdleConns, cfg.DBConnMaxLifetime, cfg.DBConnMaxIdleTime)

	return db
}

func Close(db *sqlx.DB) {
	if err := db.Close(); err != nil {
		log.Printf("[db] close error: %v", err)
	}
}
