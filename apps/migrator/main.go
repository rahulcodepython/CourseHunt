package main

import (
	"embed"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/joho/godotenv"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func main() {
	_ = godotenv.Load()

	if len(os.Args) < 2 {
		log.Fatalf("[migrator] usage: migrator <commit|up|down|version>")
	}
	cmd := os.Args[1]

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/coursehunt?sslmode=disable"
	}

	m := connect(dbURL)
	defer m.Close()

	switch cmd {
	case "commit":
		runCommit(m)
	case "up":
		runStep(m, 1)
	case "down":
		runStep(m, -1)
	case "version":
		printVersion(m)
	default:
		log.Fatalf("[migrator] unknown command %q (expected commit|up|down|version)", cmd)
	}
}

// connect opens the migrate instance, retrying with backoff since Postgres
// may still be finishing startup even when the caller's own orchestration
// (docker-compose's service_healthy) hasn't caught up yet — this makes the
// binary robust standalone too, not just inside compose.
func connect(dbURL string) *migrate.Migrate {
	source, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		log.Fatalf("[migrator] failed to load embedded migrations: %v", err)
	}

	var m *migrate.Migrate
	var lastErr error
	for attempt := 1; attempt <= 5; attempt++ {
		m, lastErr = migrate.NewWithSourceInstance("iofs", source, dbURL)
		if lastErr == nil {
			return m
		}
		log.Printf("[migrator] connect attempt %d/5 failed: %v", attempt, lastErr)
		time.Sleep(2 * time.Second)
	}
	log.Fatalf("[migrator] failed to connect after retries: %v", lastErr)
	return nil
}

func runCommit(m *migrate.Migrate) {
	log.Println("[migrator] commit: applying all pending migrations...")
	err := m.Up()
	if err != nil && errors.Is(err, migrate.ErrNoChange) {
		log.Println("[migrator] commit: already up to date, nothing to do")
		printVersion(m)
		return
	}
	if err != nil {
		failDirty(err)
	}
	log.Println("[migrator] commit: schema is now at the latest version")
	printVersion(m)
}

func runStep(m *migrate.Migrate, delta int) {
	verb := "up"
	if delta < 0 {
		verb = "down"
	}
	log.Printf("[migrator] %s: stepping one version...", verb)
	err := m.Steps(delta)
	if err != nil && errors.Is(err, migrate.ErrNoChange) {
		log.Printf("[migrator] %s: no further migrations to apply", verb)
		printVersion(m)
		return
	}
	if err != nil {
		failDirty(err)
	}
	printVersion(m)
}

func failDirty(err error) {
	var dirtyErr migrate.ErrDirty
	if errors.As(err, &dirtyErr) {
		log.Fatalf("[migrator] database is dirty at version %d — a previous migration failed partway through and needs manual repair before this can proceed: %v", dirtyErr.Version, err)
	}
	log.Fatalf("[migrator] migration failed: %v", err)
}

func printVersion(m *migrate.Migrate) {
	version, dirty, err := m.Version()
	if err != nil && errors.Is(err, migrate.ErrNilVersion) {
		fmt.Println("[migrator] version: none (no migrations applied yet)")
		return
	}
	if err != nil {
		log.Printf("[migrator] version: error reading version: %v", err)
		return
	}
	fmt.Printf("[migrator] version: %d (dirty=%v)\n", version, dirty)
}
