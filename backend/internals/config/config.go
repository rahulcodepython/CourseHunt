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
	AllowedOrigins        string `env:"ALLOWED_ORIGINS" envDefault:"http://localhost:3000"`
	JWKSURL               string `env:"JWKS_URL" envDefault:"http://localhost:3000/api/auth/jwks"`
	JWTCookieName         string `env:"JWT_COOKIE_NAME" envDefault:"better-auth.session_token"`
	RazorpayKeyID         string `env:"RAZORPAY_KEY_ID"`
	RazorpaySecret        string `env:"RAZORPAY_SECRET"`
	RazorpayWebhookSecret string `env:"RAZORPAY_WEBHOOK_SECRET"`
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
