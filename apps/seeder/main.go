package main

import (
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

//go:embed seeds/*.sql
var seedFS embed.FS

// PermissionFile mirrors the repo-root permissions.json (single source of
// truth for the system RBAC catalog).
type PermissionFile struct {
	Roles []RoleSeed `json:"roles"`
}

type RoleSeed struct {
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Permissions []PermissionSeed `json:"permissions"`
}

type PermissionSeed struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func main() {
	// Load environment variables via godotenv
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/coursehunt?sslmode=disable"
	}

	permsPath := flag.String("permissions", "", "path to permissions.json (default: nearest permissions.json walking up from cwd)")
	flag.Parse()

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

	// Load the RBAC catalog from the root permissions.json.
	permsFile, err := loadPermissionsFile(*permsPath)
	if err != nil {
		log.Fatalf("[seeder] Failed to load permissions: %v", err)
	}
	log.Printf("[seeder] Loaded %d roles and %d permissions from permissions.json",
		len(permsFile.Roles), countPermissions(permsFile))

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

	// 2. Seed RBAC (roles, permissions, role_permissions) from permissions.json
	log.Println("==================================================")
	log.Println("[seeder] SEEDING ROLES, PERMISSIONS AND ROLE MAPPINGS...")
	log.Println("==================================================")
	seedRbac(db, permsFile)

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

// loadPermissionsFile reads permissions.json, resolving a default path by
// walking up from the working directory until the file is found.
func loadPermissionsFile(path string) (*PermissionFile, error) {
	if path == "" {
		dir, err := os.Getwd()
		if err != nil {
			return nil, fmt.Errorf("getwd: %w", err)
		}
		for i := 0; i < 6; i++ {
			candidate := filepath.Join(dir, "permissions.json")
			if _, err := os.Stat(candidate); err == nil {
				path = candidate
				break
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}
	if path == "" {
		return nil, fmt.Errorf("permissions.json not found (walked up from cwd); pass -permissions explicitly")
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}
	var file PermissionFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return nil, fmt.Errorf("parse %s: %w", path, err)
	}
	if len(file.Roles) == 0 {
		return nil, fmt.Errorf("%s contains no roles", path)
	}
	return &file, nil
}

func countPermissions(file *PermissionFile) int {
	total := 0
	for _, role := range file.Roles {
		total += len(role.Permissions)
	}
	return total
}

// seedRbac inserts the system roles, permissions, and role_permissions
// mappings straight from permissions.json (replacing the old hardcoded SQL).
func seedRbac(db *sqlx.DB, file *PermissionFile) {
	for _, role := range file.Roles {
		if _, err := db.Exec(
			`INSERT INTO roles (name, description, is_system) VALUES ($1, $2, true)
			 ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
			role.Name, role.Description,
		); err != nil {
			log.Fatalf("[seeder] Failed to seed role %q: %v", role.Name, err)
		}
	}

	for _, role := range file.Roles {
		for _, p := range role.Permissions {
			if _, err := db.Exec(
				`INSERT INTO permissions (id, name) VALUES ($1, $2)
				 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
				p.ID, p.Name,
			); err != nil {
				log.Fatalf("[seeder] Failed to seed permission %q: %v", p.ID, err)
			}
		}
	}

	// Reset system-role mappings to the exact set defined in permissions.json.
	if _, err := db.Exec(
		`DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE is_system = true)`,
	); err != nil {
		log.Fatalf("[seeder] Failed to reset role_permissions: %v", err)
	}

	for _, role := range file.Roles {
		for _, p := range role.Permissions {
			if _, err := db.Exec(
				`INSERT INTO role_permissions (role_id, permission_id)
				 SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
				 WHERE r.name = $1 AND p.id = $2
				 ON CONFLICT DO NOTHING`,
				role.Name, p.ID,
			); err != nil {
				log.Fatalf("[seeder] Failed to map %q -> %q: %v", role.Name, p.ID, err)
			}
		}
	}

	for _, role := range file.Roles {
		log.Printf("[seeder] ✓ role %q (%d permissions)", role.Name, len(role.Permissions))
	}
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
