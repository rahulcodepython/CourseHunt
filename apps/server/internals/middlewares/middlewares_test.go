package middlewares

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/services"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jmoiron/sqlx"
)

func testCfg() *config.Config {
	return &config.Config{
		JWTSecret:           "super-secret-test-key-0123456789",
		JWTTTLMinutes:       15,
		RefreshTokenTTLDays: 7,
		AuthCookieName:      "access_token",
		RefreshCookieName:   "refresh_token",
		RefreshCookiePath:   "/",
		CookieDomain:        "",
	}
}

func doRequest(t *testing.T, app *fiber.App, req *http.Request) *http.Response {
	t.Helper()
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	return resp
}

func getRequest(method, target string, cookies ...*http.Cookie) *http.Request {
	req := httptest.NewRequest(method, target, nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	return req
}

func get(method, target string, cookies ...*http.Cookie) *http.Request {
	return getRequest(method, target, cookies...)
}

func decodeJSON(t *testing.T, resp *http.Response, dst interface{}) {
	t.Helper()
	defer resp.Body.Close()
	if resp.Header.Get(fiber.HeaderContentType) != "" {
		// fine, decode below
	}
	if err := json.NewDecoder(resp.Body).Decode(dst); err != nil {
		t.Fatalf("decode json: %v", err)
	}
}

// ---------------------------------------------------------------------------
// parseAndValidateJWT
// ---------------------------------------------------------------------------

func buildAccessToken(t *testing.T, cfg *config.Config, subject string, banned bool, ttl time.Duration) string {
	t.Helper()
	claims := &generic.UserClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   subject,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
		},
		Roles:       []string{"user"},
		Permissions: []string{"user:notes:manage"},
		Banned:      banned,
	}
	s, err := jwt.NewWithClaims(jwt.SigningMethodHS512, claims).SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return s
}

func TestParseAndValidateJWT(t *testing.T) {
	cfg := testCfg()

	t.Run("valid token parses and maps subject", func(t *testing.T) {
		claims, err := parseAndValidateJWT(cfg, buildAccessToken(t, cfg, "user-1", false, time.Hour))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if claims.Subject != "user-1" {
			t.Fatalf("subject = %q", claims.Subject)
		}
	})

	t.Run("banned user is rejected", func(t *testing.T) {
		_, err := parseAndValidateJWT(cfg, buildAccessToken(t, cfg, "u-banned", true, time.Hour))
		if err == nil || err.Error() != "account is banned" {
			t.Fatalf("err = %v, want banned error", err)
		}
	})

	t.Run("expired token is rejected", func(t *testing.T) {
		if _, err := parseAndValidateJWT(cfg, buildAccessToken(t, cfg, "u1", false, -time.Hour)); err == nil {
			t.Fatal("expected expired error")
		}
	})

	t.Run("malformed token is rejected", func(t *testing.T) {
		if _, err := parseAndValidateJWT(cfg, "definitely.not.a.token"); err == nil {
			t.Fatal("expected error")
		}
	})

	t.Run("empty token is rejected", func(t *testing.T) {
		if _, err := parseAndValidateJWT(cfg, ""); err == nil {
			t.Fatal("expected error")
		}
	})

	t.Run("token signed with different secret is rejected", func(t *testing.T) {
		other := &config.Config{JWTSecret: "a-completely-different-secret"}
		tok := buildAccessToken(t, other, "u1", false, time.Hour)
		if _, err := parseAndValidateJWT(cfg, tok); err == nil {
			t.Fatal("expected error with wrong secret")
		}
	})

	t.Run("algorithm downgrade to HS256 is rejected", func(t *testing.T) {
		claims := &generic.UserClaims{
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   "u1",
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			},
			Roles: []string{"user"},
		}
		tok, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			t.Fatalf("sign hs256: %v", err)
		}
		if _, err := parseAndValidateJWT(cfg, tok); err == nil {
			t.Fatal("expected HS256 rejection")
		}
	})
}

// ---------------------------------------------------------------------------
// parseAndValidateRefreshJWT
// ---------------------------------------------------------------------------

func buildRefreshToken(t *testing.T, cfg *config.Config, typ string, ttl time.Duration) string {
	t.Helper()
	claims := jwt.MapClaims{
		"type": typ,
		"jti":  "jti-1",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(ttl).Unix(),
	}
	s, err := jwt.NewWithClaims(jwt.SigningMethodHS512, claims).SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		t.Fatalf("sign refresh: %v", err)
	}
	return s
}

func TestParseAndValidateRefreshJWT(t *testing.T) {
	cfg := testCfg()

	t.Run("valid refresh token passes", func(t *testing.T) {
		if err := parseAndValidateRefreshJWT(cfg, buildRefreshToken(t, cfg, "refresh", time.Hour)); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("access token can not be used as refresh", func(t *testing.T) {
		if err := parseAndValidateRefreshJWT(cfg, buildRefreshToken(t, cfg, "access", time.Hour)); err == nil {
			t.Fatal("expected type error")
		}
	})

	t.Run("expired refresh token rejected", func(t *testing.T) {
		if err := parseAndValidateRefreshJWT(cfg, buildRefreshToken(t, cfg, "refresh", -time.Hour)); err == nil {
			t.Fatal("expected error")
		}
	})

	t.Run("malformed refresh token rejected", func(t *testing.T) {
		if err := parseAndValidateRefreshJWT(cfg, "garbage.garbage.garbage"); err == nil {
			t.Fatal("expected error")
		}
	})
}

// ---------------------------------------------------------------------------
// setUserContext
// ---------------------------------------------------------------------------

func TestSetUserContext(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		setUserContext(c, &generic.UserClaims{
			RegisteredClaims: jwt.RegisteredClaims{Subject: "u-1"},
			Roles:            []string{"tutor"},
			Permissions:      []string{"tutor:courses:manage", "tutor:dashboard"},
		})
		u, ok := c.Locals("user").(*generic.UserContext)
		if !ok || u == nil {
			t.Fatal("user context not set")
		}
		if u.UserID != "u-1" || len(u.Roles) != 1 || len(u.Permissions) != 2 {
			t.Fatalf("unexpected context: %+v", u)
		}
		if _, ok := u.Permissions["tutor:courses:manage"]; !ok {
			t.Fatal("permission missing from set")
		}
		return c.SendStatus(fiber.StatusOK)
	})
	resp := doRequest(t, app, get(http.MethodGet, "/"))
	defer resp.Body.Close()
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d", resp.StatusCode)
	}
}

// ---------------------------------------------------------------------------
// PermissionGuard
// ---------------------------------------------------------------------------

func permissionApp(user *generic.UserContext, handler fiber.Handler) *fiber.App {
	app := fiber.New()
	app.Get("/",
		func(c *fiber.Ctx) error {
			if user != nil {
				c.Locals("user", user)
			}
			return c.Next()
		},
		PermissionGuard("user:notes:manage", "admin:dashboard"),
		handler,
	)
	return app
}

func TestPermissionGuard(t *testing.T) {
	t.Run("no authenticated user returns 401", func(t *testing.T) {
		app := permissionApp(nil, func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
		resp := doRequest(t, app, get(http.MethodGet, "/"))
		defer resp.Body.Close()
		if resp.StatusCode != fiber.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", resp.StatusCode)
		}
	})

	t.Run("user without required permission returns 403", func(t *testing.T) {
		user := &generic.UserContext{UserID: "u1", Permissions: map[string]struct{}{"user:other:thing": {}}}
		app := permissionApp(user, func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
		resp := doRequest(t, app, get(http.MethodGet, "/"))
		defer resp.Body.Close()
		if resp.StatusCode != fiber.StatusForbidden {
			t.Fatalf("status = %d, want 403", resp.StatusCode)
		}
	})

	t.Run("user with any required permission passes", func(t *testing.T) {
		user := &generic.UserContext{UserID: "u1", Permissions: map[string]struct{}{
			"user:other:thing": {},
			"admin:dashboard":  {},
		}}
		app := permissionApp(user, func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
		resp := doRequest(t, app, get(http.MethodGet, "/"))
		defer resp.Body.Close()
		if resp.StatusCode != fiber.StatusOK {
			t.Fatalf("status = %d, want 200", resp.StatusCode)
		}
	})

	t.Run("matched permission is stored in locals", func(t *testing.T) {
		user := &generic.UserContext{UserID: "u1", Permissions: map[string]struct{}{"user:notes:manage": {}}}
		var got interface{}
		app := permissionApp(user, func(c *fiber.Ctx) error {
			got = c.Locals("permission")
			return c.SendStatus(fiber.StatusOK)
		})
		resp := doRequest(t, app, get(http.MethodGet, "/"))
		defer resp.Body.Close()
		if got.(string) != "user:notes:manage" {
			t.Fatalf("locals permission = %v", got)
		}
	})
}

// ---------------------------------------------------------------------------
// BaseAuthMiddleware
// ---------------------------------------------------------------------------

func newAuthApp(cfg *config.Config, svc *services.AuthService) *fiber.App {
	app := fiber.New()
	app.Get("/",
		BaseAuthMiddleware(cfg, svc, cache.NewCache(nil)),
		func(c *fiber.Ctx) error {
			u, _ := c.Locals("user").(*generic.UserContext)
			return c.JSON(fiber.Map{"authenticated": u != nil})
		},
	)
	return app
}

func TestBaseAuthMiddleware(t *testing.T) {
	cfg := testCfg()

	t.Run("no credentials returns 401", func(t *testing.T) {
		app := newAuthApp(cfg, nil)
		resp := doRequest(t, app, get(http.MethodGet, "/"))
		defer resp.Body.Close()
		if resp.StatusCode != fiber.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", resp.StatusCode)
		}
	})

	t.Run("valid access token passes without DB", func(t *testing.T) {
		app := newAuthApp(cfg, nil)
		access := buildAccessToken(t, cfg, "u1", false, time.Hour)
		resp := doRequest(t, app, get(http.MethodGet, "/", &http.Cookie{Name: cfg.AuthCookieName, Value: access}))
		defer resp.Body.Close()
		if resp.StatusCode != fiber.StatusOK {
			t.Fatalf("status = %d, want 200", resp.StatusCode)
		}
	})

	t.Run("expired access token only returns 401", func(t *testing.T) {
		app := newAuthApp(cfg, nil)
		access := buildAccessToken(t, cfg, "u1", false, -time.Hour)
		resp := doRequest(t, app, get(http.MethodGet, "/", &http.Cookie{Name: cfg.AuthCookieName, Value: access}))
		defer resp.Body.Close()
		if resp.StatusCode != fiber.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", resp.StatusCode)
		}
	})

	t.Run("banned access token returns 401", func(t *testing.T) {
		app := newAuthApp(cfg, nil)
		access := buildAccessToken(t, cfg, "u-banned", true, time.Hour)
		resp := doRequest(t, app, get(http.MethodGet, "/", &http.Cookie{Name: cfg.AuthCookieName, Value: access}))
		defer resp.Body.Close()
		if resp.StatusCode != fiber.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", resp.StatusCode)
		}
	})

	t.Run("refresh flow rotates session and authenticates", func(t *testing.T) {
		mockDB, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("sqlmock: %v", err)
		}
		defer mockDB.Close()
		db := sqlx.NewDb(mockDB, "postgres")

		userJSON := `{"id":"u1","name":"Alice","email":"alice@example.com",` +
			`"emailVerified":true,"image":null,"createdAt":"2024-01-01T00:00:00Z",` +
			`"updatedAt":"2024-01-01T00:00:00Z","banned":false,"passwordChangedAt":null,` +
			`"roles":["user"],"permissions":["user:notes:manage"]}`

		mock.ExpectQuery("SELECT row_to_json").
			WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
			WillReturnRows(sqlmock.NewRows([]string{"row_to_json"}).AddRow(userJSON)).
			WillDelayFor(0)

		svc := services.NewAuthService(repositories.NewAuthRepository(db), cfg)
		app := newAuthApp(cfg, svc)

		access := buildAccessToken(t, cfg, "u1", false, -time.Hour)
		refresh := buildRefreshToken(t, cfg, "refresh", time.Hour)

		resp := doRequest(t, app, get(http.MethodGet, "/",
			&http.Cookie{Name: cfg.AuthCookieName, Value: access},
			&http.Cookie{Name: cfg.RefreshCookieName, Value: refresh},
		))
		defer resp.Body.Close()

		if resp.StatusCode != fiber.StatusOK {
			t.Fatalf("status = %d, want 200 after refresh", resp.StatusCode)
		}

		var body struct {
			Authenticated bool `json:"authenticated"`
		}
		decodeJSON(t, resp, &body)
		if !body.Authenticated {
			t.Fatal("expected authenticated=true after refresh rotation")
		}

		// new refresh session must be saved
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet sqlmock expectations: %v", err)
		}
	})

	t.Run("stale refresh token without rotation returns 401", func(t *testing.T) {
		mockDB, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("sqlmock: %v", err)
		}
		defer mockDB.Close()
		db := sqlx.NewDb(mockDB, "postgres")

		// Rotate session query yields no rows -> session expired.
		mock.ExpectQuery("SELECT row_to_json").WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
			WillReturnRows(sqlmock.NewRows([]string{"row_to_json"}))

		svc := services.NewAuthService(repositories.NewAuthRepository(db), cfg)
		app := newAuthApp(cfg, svc)

		access := buildAccessToken(t, cfg, "u1", false, -time.Hour)
		refresh := buildRefreshToken(t, cfg, "refresh", time.Hour)
		resp := doRequest(t, app, get(http.MethodGet, "/",
			&http.Cookie{Name: cfg.AuthCookieName, Value: access},
			&http.Cookie{Name: cfg.RefreshCookieName, Value: refresh},
		))
		defer resp.Body.Close()
		if resp.StatusCode != fiber.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", resp.StatusCode)
		}
	})
}