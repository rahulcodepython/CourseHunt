package utils

import (
	"bytes"
	js "encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"

	"github.com/gofiber/fiber/v2"
)

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

func doRequest(t *testing.T, app *fiber.App, method, target, body string) *http.Response {
	t.Helper()
	var req *http.Request
	if body != "" {
		req = httptest.NewRequest(method, target, bytes.NewBufferString(body))
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	} else {
		req = httptest.NewRequest(method, target, nil)
	}
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("app.Test(%s %s): %v", method, target, err)
	}
	return resp
}

func decodeBody(t *testing.T, resp *http.Response, dst interface{}) {
	t.Helper()
	defer resp.Body.Close()
	if err := js.NewDecoder(resp.Body).Decode(dst); err != nil {
		t.Fatalf("decode response body: %v", err)
	}
}

func newApp(handler fiber.Handler) *fiber.App {
	app := fiber.New(fiber.Config{ErrorHandler: GlobalErrorHandler})
	app.Post("/", handler)
	return app
}

// ---------------------------------------------------------------------------
// PaginationParams
// ---------------------------------------------------------------------------

func TestPaginationParams(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		page, limit := PaginationParams(c)
		return c.JSON(fiber.Map{"page": page, "limit": limit})
	})

	cases := []struct {
		name       string
		query      string
		wantPage   int
		wantLimit  int
	}{
		{name: "defaults", query: "", wantPage: 1, wantLimit: 20},
		{name: "explicit valid", query: "page=3&limit=50", wantPage: 3, wantLimit: 50},
		{name: "page zero clamps to one", query: "page=0&limit=20", wantPage: 1, wantLimit: 20},
		{name: "page negative clamps to one", query: "page=-4&limit=20", wantPage: 1, wantLimit: 20},
		{name: "limit zero clamps to one", query: "page=1&limit=0", wantPage: 1, wantLimit: 1},
		{name: "limit negative clamps to one", query: "page=1&limit=-9", wantPage: 1, wantLimit: 1},
		{name: "limit capped at 100", query: "page=1&limit=1000", wantPage: 1, wantLimit: 100},
		{name: "limit exactly 100 kept", query: "page=1&limit=100", wantPage: 1, wantLimit: 100},
		{name: "non-numeric page clamps to 1", query: "page=abc&limit=50", wantPage: 1, wantLimit: 50},
		{name: "non-numeric limit clamps to 1", query: "page=2&limit=xyz", wantPage: 2, wantLimit: 1},
		{name: "mixed non-numeric both clamp", query: "page=abc&limit=xyz", wantPage: 1, wantLimit: 1},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			resp := doRequest(t, app, http.MethodGet, "/?"+tc.query, "")
			var out struct {
				Page  int `json:"page"`
				Limit int `json:"limit"`
			}
			decodeBody(t, resp, &out)
			if out.Page != tc.wantPage || out.Limit != tc.wantLimit {
				t.Fatalf("got page=%d limit=%d, want page=%d limit=%d", out.Page, out.Limit, tc.wantPage, tc.wantLimit)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// Slugify
// ---------------------------------------------------------------------------

func TestSlugify(t *testing.T) {
	suffixRe := regexp.MustCompile(`-\d+$`)

	cases := []struct {
		in   string
		want string // prefix (without timestamp) expected
	}{
		{in: "Hello World", want: "hello-world"},
		{in: "  Leading and trailing  ", want: "leading-and-trailing"},
		{in: "UPPER CASE", want: "upper-case"},
		{in: "special!@#$%^&*()chars", want: "specialchars"},
		{in: "digit 123 suffix", want: "digit-123-suffix"},
		{in: "___", want: ""},
	}

	for _, tc := range cases {
		t.Run(tc.in, func(t *testing.T) {
			got := Slugify(tc.in)
			prefix := suffixRe.ReplaceAllString(got, "")
			if prefix != tc.want {
				t.Fatalf("Slugify(%q) prefix = %q, want %q (full: %q)", tc.in, prefix, tc.want, got)
			}
			if tc.want != "" && !suffixRe.MatchString(got) {
				t.Fatalf("Slugify(%q) missing unique timestamp suffix: %q", tc.in, got)
			}
		})
	}
}

func TestSlugifyUnique(t *testing.T) {
	a := Slugify("Same Title")
	b := Slugify("Same Title")
	if a == b {
		t.Fatalf("two slugs for same input should differ, got identical %q", a)
	}
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

func TestResponseEnvelope(t *testing.T) {
	cases := []struct {
		name       string
		handler    fiber.Handler
		wantStatus int
		wantOK     bool
		hasData    bool
		hasError   bool
	}{
		{name: "OK", handler: func(c *fiber.Ctx) error { return OK(c, "done", fiber.Map{"a": 1}) }, wantStatus: 200, wantOK: true, hasData: true},
		{name: "Created", handler: func(c *fiber.Ctx) error { return Created(c, "created", "x") }, wantStatus: 201, wantOK: true, hasData: true},
		{name: "BadRequest", handler: func(c *fiber.Ctx) error { return BadRequest(c, "bad", errors.New("boom")) }, wantStatus: 400, hasError: true},
		{name: "Unauthorized", handler: func(c *fiber.Ctx) error { return Unauthorized(c, "nope", errors.New("nope")) }, wantStatus: 401, hasError: true},
		{name: "Forbidden", handler: func(c *fiber.Ctx) error { return Forbidden(c, "denied", nil) }, wantStatus: 403},
		{name: "NotFound", handler: func(c *fiber.Ctx) error { return NotFound(c, "missing", errors.New("gone")) }, wantStatus: 404, hasError: true},
		{name: "UnprocessableEntity", handler: func(c *fiber.Ctx) error { return UnprocessableEntity(c, "invalid", errors.New("x")) }, wantStatus: 422, hasError: true},
		{name: "InternalError", handler: func(c *fiber.Ctx) error { return InternalError(c, "oops", errors.New("internal")) }, wantStatus: 500, hasError: true},
		{name: "TooManyRequests", handler: func(c *fiber.Ctx) error { return TooManyRequests(c, "slow down", errors.New("rl")) }, wantStatus: 429, hasError: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			app := newApp(tc.handler)
			resp := doRequest(t, app, http.MethodPost, "/", "")
			if resp.StatusCode != tc.wantStatus {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tc.wantStatus)
			}
			var env generic.Response[any]
			decodeBody(t, resp, &env)
			if env.Success != tc.wantOK {
				t.Fatalf("success = %v, want %v", env.Success, tc.wantOK)
			}
			if (env.Data != nil) != tc.hasData {
				t.Fatalf("data presence = %v, want %v (data=%v)", env.Data != nil, tc.hasData, env.Data)
			}
			if (env.Error != "") != tc.hasError {
				t.Fatalf("error presence = %q, want %v", env.Error, tc.hasError)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// GlobalErrorHandler
// ---------------------------------------------------------------------------

func TestGlobalErrorHandler(t *testing.T) {
	cases := []struct {
		name       string
		handler    fiber.Handler
		wantStatus int
		wantOK     bool
		wantError  string
	}{
		{
			name:       "fiber 404 error becomes NotFound envelope",
			handler:    func(c *fiber.Ctx) error { return fiber.ErrNotFound },
			wantStatus: 404,
			wantOK:     false,
			wantError:  "Requested resource not found.",
		},
		{
			name:       "fiber 400 error becomes generic envelope",
			handler:    func(c *fiber.Ctx) error { return fiber.NewError(fiber.StatusBadRequest, "bad input") },
			wantStatus: 400,
			wantOK:     false,
		},
		{
			name:       "arbitrary error becomes 500",
			handler:    func(c *fiber.Ctx) error { return errors.New("internal boom") },
			wantStatus: 500,
			wantOK:     false,
		},
		{
			name: "handler that passes through (no error) returns 200",
			handler: func(c *fiber.Ctx) error {
				return c.SendStatus(fiber.StatusOK)
			},
			wantStatus: 200,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			app := fiber.New(fiber.Config{ErrorHandler: GlobalErrorHandler})
			app.Get("/", tc.handler)
			resp := doRequest(t, app, http.MethodGet, "/", "")
			if resp.StatusCode != tc.wantStatus {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tc.wantStatus)
			}
			if resp.StatusCode != fiber.StatusOK {
				var env generic.Response[any]
				decodeBody(t, resp, &env)
				if tc.wantError != "" && env.Message != tc.wantError {
					t.Fatalf("message = %q, want %q", env.Message, tc.wantError)
				}
			} else {
				resp.Body.Close()
			}
		})
	}
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

func TestValidate(t *testing.T) {
	app := fiber.New()
	app.Post("/", func(c *fiber.Ctx) error {
		var req entities.CreateUserRequest
		ok, err := Validate(c, &req)
		if !ok {
			return err
		}
		return OK(c, "valid", req)
	})

	t.Run("invalid json returns 400", func(t *testing.T) {
		resp := doRequest(t, app, http.MethodPost, "/", `{not-json`)
		if resp.StatusCode != fiber.StatusBadRequest {
			t.Fatalf("status = %d, want 400", resp.StatusCode)
		}
		var env generic.Response[any]
		decodeBody(t, resp, &env)
		if env.Message != "Invalid request body." {
			t.Fatalf("message = %q", env.Message)
		}
	})

	t.Run("missing required fields returns 422", func(t *testing.T) {
		resp := doRequest(t, app, http.MethodPost, "/", `{}`)
		if resp.StatusCode != fiber.StatusUnprocessableEntity {
			t.Fatalf("status = %d, want 422", resp.StatusCode)
		}
		var env generic.Response[any]
		decodeBody(t, resp, &env)
		if env.Message != "Validation failed." {
			t.Fatalf("message = %q", env.Message)
		}
		if env.Error == "" {
			t.Fatal("expected error detail to list failing fields")
		}
	})

	t.Run("invalid email returns 422", func(t *testing.T) {
		resp := doRequest(t, app, http.MethodPost, "/", `{"name":"A","email":"not-an-email","password":"12345678","role":"tutor"}`)
		if resp.StatusCode != fiber.StatusUnprocessableEntity {
			t.Fatalf("status = %d, want 422", resp.StatusCode)
		}
	})

	t.Run("short password returns 422", func(t *testing.T) {
		resp := doRequest(t, app, http.MethodPost, "/", `{"name":"A","email":"a@b.com","password":"short","role":"tutor"}`)
		if resp.StatusCode != fiber.StatusUnprocessableEntity {
			t.Fatalf("status = %d, want 422", resp.StatusCode)
		}
	})

	t.Run("invalid role oneof returns 422", func(t *testing.T) {
		resp := doRequest(t, app, http.MethodPost, "/", `{"name":"A","email":"a@b.com","password":"12345678","role":"superadmin"}`)
		if resp.StatusCode != fiber.StatusUnprocessableEntity {
			t.Fatalf("status = %d, want 422", resp.StatusCode)
		}
	})

	t.Run("valid body passes and returns data", func(t *testing.T) {
		resp := doRequest(t, app, http.MethodPost, "/", `{"name":"Alice","email":"alice@b.com","password":"12345678","role":"tutor"}`)
		if resp.StatusCode != fiber.StatusOK {
			t.Fatalf("status = %d, want 200 (body: %v)", resp.StatusCode, resp)
		}
		var env generic.Response[entities.CreateUserRequest]
		decodeBody(t, resp, &env)
		if !env.Success || env.Data.Email != "alice@b.com" {
			t.Fatalf("unexpected envelope: %+v", env)
		}
	})
}

// ---------------------------------------------------------------------------
// GetUserID / GetUserFromCtx
// ---------------------------------------------------------------------------

func TestGetUserFromCtx(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"id":     GetUserID(c),
			"exists": GetUserFromCtx(c) != nil,
		})
	})

	t.Run("no user set", func(t *testing.T) {
		resp := doRequest(t, app, http.MethodGet, "/", "")
		var out struct {
			ID     string `json:"id"`
			Exists bool   `json:"exists"`
		}
		decodeBody(t, resp, &out)
		if out.ID != "" || out.Exists {
			t.Fatalf("got %+v, want empty id and no user", out)
		}
	})

	t.Run("user set", func(t *testing.T) {
		app2 := fiber.New()
		app2.Get("/", func(c *fiber.Ctx) error {
			c.Locals("user", &generic.UserContext{UserID: "user-123", Roles: []string{"user"}})
			return c.JSON(fiber.Map{
				"id":     GetUserID(c),
				"exists": GetUserFromCtx(c) != nil,
				"role":   GetUserFromCtx(c).Roles[0],
			})
		})
		resp := doRequest(t, app2, http.MethodGet, "/", "")
		var out struct {
			ID     string `json:"id"`
			Exists bool   `json:"exists"`
			Role   string `json:"role"`
		}
		decodeBody(t, resp, &out)
		if out.ID != "user-123" || !out.Exists || out.Role != "user" {
			t.Fatalf("got %+v", out)
		}
	})

	t.Run("wrong type in locals ignored", func(t *testing.T) {
		app3 := fiber.New()
		app3.Get("/", func(c *fiber.Ctx) error {
			c.Locals("user", "not-a-context")
			return c.JSON(fiber.Map{
				"id":     GetUserID(c),
				"exists": GetUserFromCtx(c) != nil,
			})
		})
		resp := doRequest(t, app3, http.MethodGet, "/", "")
		var out struct {
			ID     string `json:"id"`
			Exists bool   `json:"exists"`
		}
		decodeBody(t, resp, &out)
		if out.ID != "" || out.Exists {
			t.Fatalf("got %+v", out)
		}
	})
}

// ---------------------------------------------------------------------------
// Scalar docs
// ---------------------------------------------------------------------------

func TestServeScalarDocs(t *testing.T) {
	app := fiber.New()
	ServeScalarDocs(app)

	resp := doRequest(t, app, http.MethodGet, "/docs/openapi.json", "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("openapi.json status = %d", resp.StatusCode)
	}
	var spec map[string]interface{}
	decodeBody(t, resp, &spec)
	if spec["openapi"] == nil || spec["paths"] == nil {
		t.Fatalf("openapi spec missing keys: %v", spec)
	}

	resp2 := doRequest(t, app, http.MethodGet, "/docs", "")
	if resp2.StatusCode != http.StatusOK {
		t.Fatalf("/docs status = %d", resp2.StatusCode)
	}
	ct := resp2.Header.Get(fiber.HeaderContentType)
	if ct == "" {
		t.Fatal("/docs missing content-type")
	}
}
