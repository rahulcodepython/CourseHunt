package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	Port           string
	DatabaseURL    string
	MinioEnd       string
	MinioAccess    string
	MinioSecret    string
	MinioBucket    string
	MinioSecure    bool
	MinioBaseURL   string
	AuthSecret     string
	AllowedOrigins string
	JWKSURL        string
	AuthCookieKey  string
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
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/coursehunt?sslmode=disable"),
		MinioEnd:       getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccess:    getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecret:    getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinioBucket:    getEnv("MINIO_BUCKET", "coursehunt"),
		MinioBaseURL:   getEnv("MINIO_BASE_URL", "http://localhost:9000/coursehunt"),
		AuthSecret:     getEnv("BETTER_AUTH_SECRET", ""),
		MinioSecure:    getEnvAsBool("MINIO_SECURE", "false"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		JWKSURL:        getEnv("JWKS_URL", "http://localhost:3000/api/auth/jwks"),
		AuthCookieKey:  getEnv("BETTER_AUTH_COOKIE_NAME", "better-auth.session_token"),
	}

	if err := validateConfig(CFG); err != nil {
		return nil, err
	}

	return CFG, nil
}

// validateConfig ensures required fields are present and stops server if invalid
func validateConfig(cfg *Config) error {
	if cfg.AuthSecret == "" {
		panic("missing required environment variable: BETTER_AUTH_SECRET")
	}
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
