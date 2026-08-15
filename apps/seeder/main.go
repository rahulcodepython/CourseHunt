package main

import (
	"embed"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

//go:embed seeds/*.sql
var seedFS embed.FS

// PermissionFile mirrors the repo-root permissions.json (single source of
// truth for the system RBAC catalog) — the flat catalog of every assignable
// permission string. There is no bootstrap-role concept here on purpose:
// roles are plain data, created either by seed SQL (seeds/001_users.sql, for
// the initial admin bootstrap) or later through the /roles UI — never
// modeled specially in this file or in Go code.
type PermissionSeed struct {
	ID   string
	Name string
}

var permissionsCatalog = []PermissionSeed{
	{ID: "admin:categories:manage", Name: "Manage categories"},
	{ID: "admin:courses:inspect", Name: "Inspect all courses"},
	{ID: "admin:discussion:read", Name: "Read discussions"},
	{ID: "admin:discussion:write", Name: "Write discussions"},
	{ID: "admin:discussion:delete", Name: "Delete discussions"},
	{ID: "admin:enrollments:inspect", Name: "Inspect enrollments"},
	{ID: "admin:coupons:manage", Name: "Manage coupons"},
	{ID: "admin:updates:manage", Name: "Manage updates"},
	{ID: "admin:feedback:inspect", Name: "Inspect feedbacks"},
	{ID: "admin:transactions:read_all", Name: "View all transactions"},
	{ID: "admin:users:list", Name: "List all users"},
	{ID: "admin:users:role:assign", Name: "Assign user roles"},
	{ID: "admin:users:role:revoke", Name: "Revoke user roles"},
	{ID: "admin:users:create", Name: "Create user accounts"},
	{ID: "admin:users:read", Name: "Read user details"},
	{ID: "admin:roles:create", Name: "Create custom roles"},
	{ID: "admin:roles:read", Name: "List roles and permissions"},
	{ID: "admin:roles:update", Name: "Update custom roles"},
	{ID: "admin:roles:delete", Name: "Delete custom roles"},
	{ID: "admin:roles:assign", Name: "Assign custom roles"},
	{ID: "admin:profile", Name: "Access admin profiles"},
	{ID: "admin:revoke:course", Name: "Revoke or regain a user's course access"},
	{ID: "tutor:courses:manage", Name: "Manage own courses"},
	{ID: "tutor:discussion:read", Name: "Read discussions"},
	{ID: "tutor:discussion:write", Name: "Write discussions"},
	{ID: "tutor:discussion:delete", Name: "Delete discussions"},
	{ID: "tutor:feedback:manage", Name: "Manage feedbacks for own courses"},
	{ID: "tutor:quiz:manage", Name: "Manage quizzes for own courses"},
	{ID: "tutor:updates:manage", Name: "Manage updates for own courses"},
	{ID: "tutor:coupons:manage", Name: "Manage own coupons"},
}

func main() {
	// Load environment variables via godotenv
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/coursehunt?sslmode=disable"
	}

	log.Println("[seeder] Connecting to database...")
	db, err := sqlx.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("[seeder] Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("[seeder] Database ping failed: %v", err)
	}
	log.Println("[seeder] Connected successfully!")

	log.Printf("[seeder] Loaded %d permissions from catalog", len(permissionsCatalog))

	// 1. Reset Database Table Data
	log.Println("==================================================")
	log.Println("[seeder] RESETTING DATABASE TABLES (Truncating data)...")
	log.Println("==================================================")
	truncateSQL := `
		TRUNCATE "users", roles, permissions, role_permissions, categories, courses, chapters, lessons, 
		quiz_metadata, quiz_questions, quiz_options, quiz_arrange_items, 
		quiz_fill_blank_answers, quiz_attempts, quiz_attempt_single_answers, 
		quiz_attempt_multi_answers, quiz_attempt_multi_answer_options, 
		quiz_attempt_arrange_answers, quiz_attempt_fill_answers, 
		enrollments, lesson_progress, chapter_progress, feedbacks, 
		coupons, coupon_usages, transactions, webhook_events, discussions, 
		notes, updates, update_seen, certificates, wishlists, 
		cart_items, profiles RESTART IDENTITY CASCADE;
	`
	if _, err := db.Exec(truncateSQL); err != nil {
		log.Fatalf("[seeder] Failed to truncate database tables: %v", err)
	}
	log.Println("[seeder] All database tables truncated and reset successfully!")

	// 2. Seed the permission catalog
	log.Println("==================================================")
	log.Println("[seeder] SEEDING PERMISSION CATALOG...")
	log.Println("==================================================")
	seedPermissions(db)

	// 3. Run Seeds
	log.Println("==================================================")
	log.Println("[seeder] POPULATING HIGH-VOLUME SEED DATA...")
	log.Println("==================================================")
	runEmbeddedSeeds(db)

	// 4. Output Summary Verification
	log.Println("==================================================")
	log.Println("[seeder] VERIFYING SEEDED RECORD COUNTS")
	log.Println("==================================================")
	printTableCount(db, "users", `"users"`)
	printTableCount(db, "roles", "roles")
	printTableCount(db, "permissions", "permissions")
	printTableCount(db, "role_permissions", "role_permissions")
	printTableCount(db, "profiles", "profiles")
	printTableCount(db, "categories", "categories")
	printTableCount(db, "courses", "courses")
	printTableCount(db, "chapters", "chapters")
	printTableCount(db, "lessons", "lessons")
	printTableCount(db, "quizzes", "quiz_metadata")
	printTableCount(db, "quiz_questions", "quiz_questions")
	printTableCount(db, "enrollments", "enrollments")
	printTableCount(db, "lesson_progress", "lesson_progress")
	printTableCount(db, "feedbacks (reviews)", "feedbacks")
	printTableCount(db, "coupons", "coupons")
	printTableCount(db, "transactions", "transactions")
	printTableCount(db, "discussions", "discussions")
	printTableCount(db, "certificates", "certificates")
	printTableCount(db, "updates", "updates")

	log.Println("==================================================")
	log.Println("🚀 [seeder] SUCCESS: Database reset and seed complete!")
	log.Println("==================================================")
}

// seedPermissions inserts the permission catalog straight from permissionsCatalog.
func seedPermissions(db *sqlx.DB) {
	for _, p := range permissionsCatalog {
		if _, err := db.Exec(
			`INSERT INTO permissions (id, name) VALUES ($1, $2)
			 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
			p.ID, p.Name,
		); err != nil {
			log.Fatalf("[seeder] Failed to seed permission %q: %v", p.ID, err)
		}
	}
	log.Printf("[seeder] ✓ seeded %d permissions", len(permissionsCatalog))
}

func runEmbeddedSeeds(db *sqlx.DB) {
	entries, err := seedFS.ReadDir("seeds")
	if err != nil {
		log.Fatalf("[seeder] Failed to read seeds directory: %v", err)
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			files = append(files, entry.Name())
		}
	}

	sort.Strings(files)

	for _, fileName := range files {
		filePath := fmt.Sprintf("seeds/%s", fileName)
		content, err := seedFS.ReadFile(filePath)
		if err != nil {
			log.Fatalf("[seeder] Failed to read seed %s: %v", filePath, err)
		}

		log.Printf("[seeder] Executing seed %s ...", fileName)
		if _, err := db.Exec(string(content)); err != nil {
			log.Fatalf("[seeder] ERROR executing seed %s: %v", fileName, err)
		}
		log.Printf("[seeder] ✓ Executed seed %s", fileName)
	}
}

func printTableCount(db *sqlx.DB, label, tableName string) {
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)
	if err := db.Get(&count, query); err != nil {
		log.Printf("[seeder] Count %s: error (%v)", label, err)
		return
	}
	log.Printf("[seeder] %-25s : %d rows", label, count)
}
