package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	Port                  string
	DatabaseURL           string
	MinioEnd              string
	MinioAccess           string
	MinioSecret           string
	MinioBucket           string
	MinioSecure           bool
	MinioBaseURL          string
	AllowedOrigins        string
	JWKSURL               string
	RazorpayKeyID         string
	RazorpaySecret        string
	RazorpayWebhookSecret string
}

var CFG *Config

// LoadConfig loads environment variables into Config struct
func LoadConfig() (*Config, error) {
	err := godotenv.Load()
	if err != nil {
		// If the file isn't found in production, you can choose to ignore it
		// and fall back to system environment variables.
		log.Println("Warning: No .env file found. Relying on system environment variables.")
	}

	CFG = &Config{
		Port:                  getEnv("PORT", "8080"),
		DatabaseURL:           getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/coursehunt?sslmode=disable"),
		MinioEnd:              getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccess:           getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecret:           getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinioBucket:           getEnv("MINIO_BUCKET", "coursehunt"),
		MinioBaseURL:          getEnv("MINIO_BASE_URL", "http://localhost:9000/coursehunt"),
		MinioSecure:           getEnvAsBool("MINIO_SECURE", "false"),
		AllowedOrigins:        getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		JWKSURL:               getEnv("JWKS_URL", "http://localhost:3000/api/auth/jwks"),
		RazorpayKeyID:         getEnv("RAZORPAY_KEY_ID", ""),
		RazorpaySecret:        getEnv("RAZORPAY_SECRET", ""),
		RazorpayWebhookSecret: getEnv("RAZORPAY_WEBHOOK_SECRET", ""),
	}

	if err := validateConfig(CFG); err != nil {
		return nil, err
	}

	return CFG, nil
}

// validateConfig ensures required fields are present and stops server if invalid
func validateConfig(cfg *Config) error {
	if cfg.MinioBucket == "" {
		panic("missing required environment variable: MINIO_BUCKET")
	}
	return nil
}

// getEnv retrieves env variable or fallback
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// getEnvAsBool parses boolean env variables
func getEnvAsBool(key, fallback string) bool {
	val := getEnv(key, fallback)
	return val == "true"
}
