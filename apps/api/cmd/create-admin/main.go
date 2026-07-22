package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"

	"coursehunt/api/internals/config"
	"coursehunt/api/internals/database"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	email := flag.String("email", "", "Admin email address")
	password := flag.String("password", "", "Admin password")
	name := flag.String("name", "", "Admin name")
	flag.Parse()

	if *email == "" || *password == "" || *name == "" {
		fmt.Println("Usage: go run apps/api/cmd/create-admin/main.go -email admin@example.com -password securepass -name 'Super Admin'")
		os.Exit(1)
	}

	if len(*password) < 8 {
		log.Fatal("Password must be at least 8 characters")
	}

	cfg := config.Load()
	db := database.Connect(cfg)
	defer database.Close(db)

	sqlxDB := sqlx.NewDb(db, "postgres")

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	tx, err := sqlxDB.Beginx()
	if err != nil {
		log.Fatalf("Failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	var userID string
	err = tx.Get(&userID, `INSERT INTO "user" (name, email, "emailVerified") VALUES ($1, $2, true) RETURNING id`, *name, *email)
	if err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}

	_, err = tx.Exec(`INSERT INTO "account" (id, "accountId", "providerId", "userId", password) VALUES (gen_random_uuid()::text, $1, 'credential', $1, $2)`, userID, string(hashedPassword))
	if err != nil {
		log.Fatalf("Failed to create account: %v", err)
	}

	var adminRoleID int
	err = tx.Get(&adminRoleID, `SELECT id FROM roles WHERE name = 'admin'`)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Fatal("Admin role not found. Run migrations first.")
		}
		log.Fatalf("Failed to find admin role: %v", err)
	}

	_, err = tx.Exec(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, adminRoleID)
	if err != nil {
		log.Fatalf("Failed to assign admin role: %v", err)
	}

	if err := tx.Commit(); err != nil {
		log.Fatalf("Failed to commit transaction: %v", err)
	}

	log.Printf("Admin user created successfully: ID=%s, Email=%s, Name=%s (password change required)", userID, *email, *name)
}
