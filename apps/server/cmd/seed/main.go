package main

import (
	"context"
	"embed"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed seeds/*.sql
var seedFS embed.FS

// PermissionSeed mirrors permissionsCatalog — the flat catalog of every
// assignable permission string in CourseHunt.
type PermissionSeed struct {
	ID   string
	Name string
}

var permissionsCatalog = []PermissionSeed{
	{ID: generic.PermAdminCategoriesManage, Name: "Manage categories"},
	{ID: generic.PermAdminCoursesInspect, Name: "Inspect all courses"},
	{ID: generic.PermAdminDiscussionRead, Name: "Read discussions"},
	{ID: generic.PermAdminDiscussionWrite, Name: "Write discussions"},
	{ID: generic.PermAdminDiscussionDelete, Name: "Delete discussions"},
	{ID: generic.PermAdminEnrollmentsInspect, Name: "Inspect enrollments"},
	{ID: generic.PermAdminCouponsManage, Name: "Manage coupons"},
	{ID: generic.PermAdminUpdatesManage, Name: "Manage updates"},
	{ID: generic.PermAdminFeedbackInspect, Name: "Inspect feedbacks"},
	{ID: generic.PermAdminTransactionsReadAll, Name: "View all transactions"},
	{ID: generic.PermAdminUsersList, Name: "List all users"},
	{ID: generic.PermAdminUsersRoleAssign, Name: "Assign user roles"},
	{ID: generic.PermAdminUsersRoleRevoke, Name: "Revoke user roles"},
	{ID: generic.PermAdminUsersCreate, Name: "Create user accounts"},
	{ID: generic.PermAdminUsersRead, Name: "Read user details"},
	{ID: generic.PermAdminUsersBan, Name: "Ban or unban user accounts"},
	{ID: generic.PermAdminUsersPasswordReset, Name: "Change any admin/tutor's password"},
	{ID: generic.PermAdminRolesCreate, Name: "Create custom roles"},
	{ID: generic.PermAdminRolesRead, Name: "List roles and permissions"},
	{ID: generic.PermAdminRolesUpdate, Name: "Update custom roles"},
	{ID: generic.PermAdminRolesDelete, Name: "Delete custom roles"},
	{ID: generic.PermAdminRolesAssign, Name: "Assign custom roles"},
	{ID: generic.PermAdminProfile, Name: "Access admin profiles"},
	{ID: generic.PermAdminRevokeCourse, Name: "Revoke or regain a user's course access"},
	{ID: generic.PermTutorCoursesManage, Name: "Manage own courses"},
	{ID: generic.PermTutorDiscussionRead, Name: "Read discussions"},
	{ID: generic.PermTutorDiscussionWrite, Name: "Write discussions"},
	{ID: generic.PermTutorDiscussionDelete, Name: "Delete discussions"},
	{ID: generic.PermTutorFeedbackManage, Name: "Manage feedbacks for own courses"},
	{ID: generic.PermTutorQuizManage, Name: "Manage quizzes for own courses"},
	{ID: generic.PermTutorUpdatesManage, Name: "Manage updates for own courses"},
	{ID: generic.PermTutorCouponsManage, Name: "Manage own coupons"},
}

func main() {
	// Load application configuration via internals/config
	cfg := config.Load()

	log.Println("[seeder] Connecting to database...")
	db := postgres.Connect(cfg)
	defer postgres.Close(db)

	log.Printf("[seeder] Loaded %d permissions from catalog", len(permissionsCatalog))

	// 0. Bootstrap the schema if the database has no tables yet.
	runMigrationsIfNeeded(db)

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
	ctx := context.Background()
	if _, err := db.Exec(ctx, truncateSQL); err != nil {
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

func runMigrationsIfNeeded(db *pgxpool.Pool) {
	ctx := context.Background()
	var exists bool
	if err := db.QueryRow(ctx, `SELECT EXISTS (
		SELECT 1 FROM information_schema.tables
		WHERE table_schema = current_schema() AND table_name = 'users'
	)`).Scan(&exists); err != nil {
		log.Fatalf("[seeder] Failed to check for existing schema: %v", err)
	}
	if exists {
		log.Println("[seeder] Schema already present, skipping migrations")
		return
	}

	dir := os.Getenv("MIGRATIONS_DIR")
	if dir == "" {
		if _, err := os.Stat("internals/migrations"); err == nil {
			dir = "internals/migrations"
		} else if _, err := os.Stat("../../internals/migrations"); err == nil {
			dir = "../../internals/migrations"
		} else {
			dir = "internals/migrations"
		}
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		log.Printf("[seeder] Note: migrations directory %q not found or readable (%v), proceeding with seed", dir, err)
		return
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			files = append(files, entry.Name())
		}
	}
	sort.Strings(files)

	log.Printf("[seeder] Applying %d migrations from %s ...", len(files), dir)
	for _, fileName := range files {
		content, err := os.ReadFile(filepath.Join(dir, fileName))
		if err != nil {
			log.Fatalf("[seeder] Failed to read migration %s: %v", fileName, err)
		}
		if _, err := db.Exec(ctx, string(content)); err != nil {
			log.Fatalf("[seeder] ERROR applying migration %s: %v", fileName, err)
		}
		log.Printf("[seeder] ✓ Applied migration %s", fileName)
	}
	log.Println("[seeder] Schema migration complete")
}

func seedPermissions(db *pgxpool.Pool) {
	ctx := context.Background()
	for _, p := range permissionsCatalog {
		if _, err := db.Exec(
			ctx,
			`INSERT INTO permissions (id, name) VALUES ($1, $2)
			 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
			p.ID, p.Name,
		); err != nil {
			log.Fatalf("[seeder] Failed to seed permission %q: %v", p.ID, err)
		}
	}
	log.Printf("[seeder] ✓ seeded %d permissions", len(permissionsCatalog))
}

func runEmbeddedSeeds(db *pgxpool.Pool) {
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

	ctx := context.Background()
	for _, fileName := range files {
		filePath := fmt.Sprintf("seeds/%s", fileName)
		content, err := seedFS.ReadFile(filePath)
		if err != nil {
			log.Fatalf("[seeder] Failed to read seed %s: %v", filePath, err)
		}

		log.Printf("[seeder] Executing seed %s ...", fileName)
		if _, err := db.Exec(ctx, string(content)); err != nil {
			log.Fatalf("[seeder] ERROR executing seed %s: %v", fileName, err)
		}
		log.Printf("[seeder] ✓ Executed seed %s", fileName)
	}
}

func printTableCount(db *pgxpool.Pool, label, tableName string) {
	ctx := context.Background()
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)
	if err := db.QueryRow(ctx, query).Scan(&count); err != nil {
		log.Printf("[seeder] Count %s: error (%v)", label, err)
		return
	}
	log.Printf("[seeder] %-25s : %d rows", label, count)
}
