package config

import (
	"log"

	"github.com/caarlos0/env/v10"
	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string `env:"PORT" envDefault:"8080"`
	DatabaseURL           string `env:"DATABASE_URL" envDefault:"postgres://postgres:postgres@localhost:5432/coursehunt?sslmode=disable"`
	MinioEnd              string `env:"MINIO_ENDPOINT" envDefault:"localhost:9000"`
	MinioAccess           string `env:"MINIO_ACCESS_KEY" envDefault:"minioadmin"`
	MinioSecret           string `env:"MINIO_SECRET_KEY" envDefault:"minioadmin"`
	MinioBucket           string `env:"MINIO_BUCKET" envDefault:"coursehunt" envRequired:"true"`
	MinioBaseURL          string `env:"MINIO_BASE_URL" envDefault:"http://localhost:9000/coursehunt"`
	MinioSecure           bool   `env:"MINIO_SECURE" envDefault:"false"`
	AllowedOrigins        string `env:"ALLOWED_ORIGINS" envDefault:"http://localhost:3000,http://localhost:3001,http://localhost:3002,https://coursehunt.com,https://tutor.coursehunt.com,https://admin.coursehunt.com"`
	JWTSecret             string `env:"JWT_SECRET" envDefault:"supersecret_jwt_key_for_dev_only"`
	CookieDomain          string `env:"COOKIE_DOMAIN" envDefault:".coursehunt.com"`
	CookieSecure          bool   `env:"COOKIE_SECURE" envDefault:"false"`
	AuthCookieName        string `env:"AUTH_COOKIE_NAME" envDefault:"access_token"`
	RefreshCookieName     string `env:"REFRESH_COOKIE_NAME" envDefault:"refresh_token"`
	GoogleClientID        string `env:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret    string `env:"GOOGLE_CLIENT_SECRET"`
	RazorpayKeyID         string `env:"RAZORPAY_KEY_ID"`
	RazorpaySecret        string `env:"RAZORPAY_SECRET"`
	RazorpayWebhookSecret string `env:"RAZORPAY_WEBHOOK_SECRET"`
	RazorpayBaseURL       string `env:"RAZORPAY_BASE_URL" envDefault:"https://api.razorpay.com/v1"`
	RedisHost             string `env:"REDIS_HOST" envDefault:"localhost"`
	RedisPort             string `env:"REDIS_PORT" envDefault:"6379"`
	RedisPassword         string `env:"REDIS_PASSWORD" envDefault:""`
	RedisDB               int    `env:"REDIS_DB" envDefault:"0"`
	DBMaxOpenConns        int    `env:"DB_MAX_OPEN_CONNS" envDefault:"25"`
	DBMaxIdleConns        int    `env:"DB_MAX_IDLE_CONNS" envDefault:"10"`
	DBConnMaxLifetime     int    `env:"DB_CONN_MAX_LIFETIME" envDefault:"5"`
}

// Load replaces init() — explicit, testable, no global state
func Load() *Config {
	_ = godotenv.Load()

	cfg := &Config{} // allocate first, then parse into it
	if err := env.Parse(cfg); err != nil {
		log.Fatalf("Failed to parse config: %v", err)
	}
	return cfg
}
