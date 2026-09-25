package config

import (
	"log"
	"time"

	"github.com/caarlos0/env/v10"
	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
)

type Config struct {
	// App
	Port          string `env:"PORT" envDefault:"8080" validate:"required,numeric"`
	Environment   string `env:"ENVIRONMENT" envDefault:"development" validate:"required,oneof=development production staging"`
	AllowedOrigin string `env:"ALLOWED_ORIGINS" envDefault:"http://localhost:3000"`

	// Database
	DatabaseURL           string        `env:"DATABASE_URL" envDefault:"postgres://postgres:postgres@localhost:5432/coursehunt?sslmode=disable" validate:"required,url"`
	DBMaxOpenConns        int           `env:"DB_MAX_OPEN_CONNS" envDefault:"25" validate:"min=1"`
	DBMaxIdleConns        int           `env:"DB_MAX_IDLE_CONNS" envDefault:"10" validate:"min=1"`
	DBConnMaxLifetime     time.Duration `env:"DB_CONN_MAX_LIFETIME" envDefault:"5m"`
	DBConnMaxIdleTime     time.Duration `env:"DB_CONN_MAX_IDLE_TIME" envDefault:"3m"`
	DBStatementTimeoutSec int           `env:"DB_STATEMENT_TIMEOUT_SEC" envDefault:"15" validate:"min=1"`
	MigrationsDir         string        `env:"MIGRATIONS_DIR" envDefault:"internals/migrations"`

	// MinIO / S3
	MinioEnd           string `env:"MINIO_ENDPOINT" envDefault:"localhost:9000" validate:"required"`
	MinioAccess        string `env:"MINIO_ACCESS_KEY" envDefault:"minioadmin"`
	MinioSecret        string `env:"MINIO_SECRET_KEY" envDefault:"minioadmin"`
	MinioBucket        string `env:"MINIO_BUCKET" envDefault:"coursehunt" validate:"required"`
	MinioBaseURL       string `env:"MINIO_BASE_URL" envDefault:"http://localhost:9000/coursehunt" validate:"required,url"`
	MinioPublicBucket  string `env:"MINIO_PUBLIC_BUCKET" envDefault:"coursehunt-public"`
	MinioPublicBaseURL string `env:"MINIO_PUBLIC_BASE_URL" envDefault:"http://localhost:9000/coursehunt-public" validate:"required,url"`
	MinioSecure        bool   `env:"MINIO_SECURE" envDefault:"false"`

	// CORS & Auth
	AllowedOrigins string `env:"ALLOWED_ORIGINS" envDefault:"http://localhost:3000,http://localhost:3001,http://localhost:3002,http://coursehunt.localhost:3000,http://admin.coursehunt.localhost:3000,https://coursehunt.com,https://tutor.coursehunt.com,https://admin.coursehunt.com"`
	JWKSURL        string `env:"JWKS_URL" envDefault:"http://localhost:3000/api/auth/jwks" validate:"required,url"`
	AuthCookieName string `env:"AUTH_COOKIE_NAME" envDefault:"access_token" validate:"required"`

	// Razorpay (Optional in dev, required in production via custom validation or tags)
	RazorpayKeyID         string  `env:"RAZORPAY_KEY_ID"`
	RazorpaySecret        string  `env:"RAZORPAY_SECRET"`
	RazorpayWebhookSecret string  `env:"RAZORPAY_WEBHOOK_SECRET"`
	RazorpayBaseURL       string  `env:"RAZORPAY_BASE_URL" envDefault:"https://api.razorpay.com/v1" validate:"url"`
	TaxPercent            float64 `env:"TAX_PERCENT" envDefault:"18" validate:"gte=0,lte=100"`

	// Redis
	RedisHost     string `env:"REDIS_HOST" envDefault:"localhost"`
	RedisPort     string `env:"REDIS_PORT" envDefault:"6379" validate:"numeric"`
	RedisPassword string `env:"REDIS_PASSWORD" envDefault:""`
	RedisDB       int    `env:"REDIS_DB" envDefault:"0" validate:"gte=0"`

	// Observability & Server Tuning
	RequestTimeoutSec int    `env:"REQUEST_TIMEOUT_SEC" envDefault:"30" validate:"min=1"`
	LokiURL           string `env:"LOKI_URL" envDefault:"http://loki:3100" validate:"url"`
}

// Load reads .env (if present), binds environment variables, and validates all constraints.
func Load() *Config {
	_ = godotenv.Load() // ignore error: .env file is optional in containerized/production setups

	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		log.Fatalf("Failed to parse config: %v", err)
	}

	validate := validator.New()
	if err := validate.Struct(cfg); err != nil {
		log.Fatalf("Failed to validate config: %v", err)
	}

	return cfg
}
