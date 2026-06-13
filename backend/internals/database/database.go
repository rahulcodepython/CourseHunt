package database

import (
	"database/sql"
	"fmt"
	"io/fs"
	"log"
	"sort"
	"strings"

	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/migrations"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func ConnectDB() {
	var err error
	cfg := config.CFG

	DB, err = sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Connected to PostgreSQL")
}

func Close() {
	if DB == nil {
		log.Printf("Database is not initialized")
	}

	if err := DB.Close(); err != nil {
		log.Printf("[db] database close: %v", err)
	}
}

func RunMigrations() error {
	entries, err := fs.ReadDir(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	// Sort by filename so migrations run in order 001_, 002_, ...
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}

		path := e.Name()
		content, err := migrations.FS.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read %s: %w", path, err)
		}

		if _, err = DB.Exec(string(content)); err != nil {
			return fmt.Errorf("execute %s: %w", e.Name(), err)
		}

		log.Printf("[db] Migration applied: %s", e.Name())
	}

	log.Println("[db] All migrations complete")
	return nil
}
