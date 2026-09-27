package middlewares

import (
	"fmt"
	"log/slog"
	"math"
	"strconv"
	"strings"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/jwt"
	"coursehunt/server/internals/utils"

	"github.com/go-redis/redis_rate/v10"
	"github.com/gofiber/fiber/v2"
	extjwt "github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
)

// ExtractClientIdentifier extracts user ID from UserContext or JWT Authorization header if available.
// When authenticated, the identifier is "user:<user_id>", ensuring that an authenticated user
// cannot bypass the rate limit by rotating IP addresses.
// If unauthenticated, it safely falls back to "ip:<ip>".
func ExtractClientIdentifier(c *fiber.Ctx, verifier *jwt.Verifier) (identifier string, userID string, ip string) {
	ip = c.IP()
	if ip == "" || ip == "0.0.0.0" {
		if xff := c.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			ip = strings.TrimSpace(parts[0])
		} else if xrip := c.Get("X-Real-IP"); xrip != "" {
			ip = strings.TrimSpace(xrip)
		}
	}
	if ip == "" {
		ip = "unknown"
	}

	// 1. If auth middleware already ran and populated UserContext in Locals
	if uid := UserID(c); uid != "" {
		identifier = "user:" + uid
		c.Locals("limiter_identifier", identifier)
		c.Locals("limiter_user_id", uid)
		c.Locals("limiter_ip", ip)
		return identifier, uid, ip
	}

	// 2. If previously resolved in this request lifecycle
	if cachedIdentifier, ok := c.Locals("limiter_identifier").(string); ok && cachedIdentifier != "" {
		cachedUID, _ := c.Locals("limiter_user_id").(string)
		return cachedIdentifier, cachedUID, ip
	}

	// 3. Inspect Authorization: Bearer <token>
	authHeader := c.Get("Authorization")
	if token, ok := strings.CutPrefix(authHeader, "Bearer "); ok && token != "" {
		if verifier != nil {
			if claims, err := verifier.Parse(token); err == nil && claims.Subject != "" {
				userID = claims.Subject
				identifier = "user:" + userID
				c.Locals("limiter_identifier", identifier)
				c.Locals("limiter_user_id", userID)
				c.Locals("limiter_ip", ip)
				return identifier, userID, ip
			}
		} else {
			// Fast unverified parsing fallback when verifier is not supplied
			parser := extjwt.NewParser()
			claims := &extjwt.RegisteredClaims{}
			if _, _, err := parser.ParseUnverified(token, claims); err == nil && claims.Subject != "" {
				userID = claims.Subject
				identifier = "user:" + userID
				c.Locals("limiter_identifier", identifier)
				c.Locals("limiter_user_id", userID)
				c.Locals("limiter_ip", ip)
				return identifier, userID, ip
			}
		}
	}

	// 4. Unauthenticated fallback to IP
	identifier = "ip:" + ip
	c.Locals("limiter_identifier", identifier)
	c.Locals("limiter_ip", ip)
	return identifier, "", ip
}

// createRateLimiter creates a Fiber middleware powered by go-redis/redis_rate (GCRA algorithm).
func createRateLimiter(
	rdb *redis.Client,
	max int,
	window time.Duration,
	keyPrefix string,
	verifier *jwt.Verifier,
	skipPredicate func(c *fiber.Ctx) bool,
) fiber.Handler {
	if rdb == nil {
		return func(c *fiber.Ctx) error {
			return c.Next()
		}
	}

	limiter := redis_rate.NewLimiter(rdb)
	limit := redis_rate.Limit{
		Rate:   max,
		Burst:  max,
		Period: window,
	}

	return func(c *fiber.Ctx) error {
		if skipPredicate != nil && skipPredicate(c) {
			return c.Next()
		}

		identifier, userID, ip := ExtractClientIdentifier(c, verifier)
		key := fmt.Sprintf("%s:%s", keyPrefix, identifier)

		res, err := limiter.Allow(c.UserContext(), key, limit)
		if err != nil {
			slog.Warn("rate limiter redis error; failing open", "error", err, "key", key)
			return c.Next()
		}

		if res.Allowed == 0 {
			retryAfterSec := int(math.Ceil(res.RetryAfter.Seconds()))
			if retryAfterSec < 1 {
				retryAfterSec = 1
			}

			slog.Warn("rate limit exceeded",
				"prefix", keyPrefix,
				"identifier", identifier,
				"user_id", userID,
				"ip", ip,
				"retry_after_sec", retryAfterSec,
			)

			c.Set("Retry-After", strconv.Itoa(retryAfterSec))
			c.Set("X-RateLimit-Limit", strconv.Itoa(max))
			c.Set("X-RateLimit-Remaining", "0")
			c.Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(res.ResetAfter).Unix(), 10))

			return utils.ErrTooManyRequests(generic.ErrMsgTooManyRequests, nil)
		}

		c.Set("X-RateLimit-Limit", strconv.Itoa(max))
		c.Set("X-RateLimit-Remaining", strconv.Itoa(res.Remaining))
		c.Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(res.ResetAfter).Unix(), 10))

		return c.Next()
	}
}

// RateLimiterMiddleware provides global rate limiting across instances using Redis GCRA.
// It tracks authenticated users by UserID (preventing multi-IP evasion) and guests by IP address.
func RateLimiterMiddleware(rdb *redis.Client, verifier ...*jwt.Verifier) fiber.Handler {
	var v *jwt.Verifier
	if len(verifier) > 0 {
		v = verifier[0]
	}

	return createRateLimiter(
		rdb,
		100,
		1*time.Minute,
		"global",
		v,
		func(c *fiber.Ctx) bool {
			// Exempt Docker and internal healthcheck endpoint from rate limiting
			return c.Path() == "/api/v1/health"
		},
	)
}

// TieredRouteRateLimiter provides route-specific rate limits (e.g. coupon checking, cert verification).
func TieredRouteRateLimiter(rdb *redis.Client, max int, expiration time.Duration, keyPrefix string, verifier ...*jwt.Verifier) fiber.Handler {
	var v *jwt.Verifier
	if len(verifier) > 0 {
		v = verifier[0]
	}

	return createRateLimiter(
		rdb,
		max,
		expiration,
		keyPrefix,
		v,
		nil,
	)
}
