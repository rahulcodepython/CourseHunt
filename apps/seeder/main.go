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

	// 1. Reset Database Table Data
	log.Println("==================================================")
	log.Println("[seeder] RESETTING DATABASE TABLES (Truncating data)...")
	log.Println("==================================================")
	truncateSQL := `
		TRUNCATE "user", roles, categories, courses, chapters, lessons, 
		quiz_metadata, quiz_questions, quiz_options, quiz_arrange_items, 
		quiz_fill_blank_answers, quiz_attempts, quiz_attempt_answers, 
		enrollments, lesson_progress, chapter_progress, feedbacks, 
		coupons, coupon_usages, transactions, webhook_events, discussions, 
		user_notes, course_updates, update_seen, certificates, wishlists, 
		cart_items RESTART IDENTITY CASCADE;
	`
	if _, err := db.Exec(truncateSQL); err != nil {
		log.Fatalf("[seeder] Failed to truncate database tables: %v", err)
	}
	log.Println("[seeder] All database tables truncated and reset successfully!")

	// 2. Run Seeds
	log.Println("==================================================")
	log.Println("[seeder] POPULATING HIGH-VOLUME SEED DATA...")
	log.Println("==================================================")
	runEmbeddedSeeds(db)

	// 3. Output Summary Verification
	log.Println("==================================================")
	log.Println("[seeder] VERIFYING SEEDED RECORD COUNTS")
	log.Println("==================================================")
	printTableCount(db, "user", `"user"`)
	printTableCount(db, "roles", "roles")
	printTableCount(db, "role_permissions", "role_permissions")
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

	log.Println("==================================================")
	log.Println("🚀 [seeder] SUCCESS: Database reset and seed complete!")
	log.Println("==================================================")
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
