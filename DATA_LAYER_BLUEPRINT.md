# Data-Layer Blueprint: DB Queries, React Query, JWT/Session

A provider-agnostic, copy-into-any-project blueprint for three specific
mechanisms implemented in this repo:

1. How raw SQL lives in Go (`<feature>.queries.go` + mega-CTE/JSON-builder
   queries + a fixed sentinel-error vocabulary).
2. How the frontend talks to the API (`react-query/` generic wrapper +
   `query-hooks/*.api.ts` + Zod response validation + optimistic updates).
3. How a JWT is fetched exactly once and handed to every API call via a
   Zustand store.

This describes **patterns**, not this app's business logic. Reference
implementation for every claim below: `apps/server/internals/features/courses/`
(backend) and `apps/web/src/{react-query,query-hooks,store,hooks}/` (frontend).
Nothing here should be copied verbatim — the shapes should.

> Note: an older `BACKEND_ARCHITECTURE_BLUEPRINT.md` in this repo describes a
> `sqlc`-generated query layer. That's stale — the codebase moved to the raw
> hand-written `.queries.go` pattern described in Part A below. Trust this
> document over that one for the DB layer.

---

# Part A — Backend DB Query Layer (Go)

## A.1 File convention: one `<feature>.queries.go` per feature

Every feature folder (`internals/features/<name>/`) gets a
`<name>.queries.go` file whose **only job is producing SQL strings**. It
never touches a database connection, never imports the driver, never does
error handling. Two shapes live in this file:

```go
package courses

import "fmt"

// Shape 1: a plain SQL string, used as-is — for a fixed, known-shape query.
const (
    CreateCourse = `
        WITH inserted AS (
            INSERT INTO courses (...) VALUES ($1, $2, ...) RETURNING *
        )
        SELECT row_to_json(inserted)::jsonb || jsonb_build_object('student_count', 0)
        FROM inserted;
    `

    GetByID = `... plain SELECT with a WHERE clause using $1, $2 ...`
)

// Shape 2: a function that TAKES params and RETURNS a formatted query
// string — for queries whose WHERE clause or LIMIT/OFFSET placeholders
// vary per call (dynamic filtering, pagination). Never build these with
// string concatenation of user input; only the pre-validated WHERE clause
// text and positional-arg index are interpolated, values always stay
// bound as $N placeholders.
func BuildPublicListQuery(whereClause string, limitParamIdx int) string {
    return fmt.Sprintf(`
        SELECT jsonb_build_object(
            'total', COALESCE((SELECT COUNT(*) FROM courses c WHERE %s), 0),
            'data', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(...) ORDER BY c.created_at DESC)
                FROM (SELECT * FROM courses c WHERE %s ORDER BY c.created_at DESC
                      LIMIT $%d OFFSET $%d) c
            ), '[]'::jsonb)
        );
    `, whereClause, whereClause, limitParamIdx, limitParamIdx+1)
}
```

Rule of thumb: if the query's shape is fixed, it's a `const`. If any part of
the SQL text itself must vary per call (not just an argument value), it's a
function returning a formatted string — the function signature makes that
variability explicit at the call site instead of hiding string-building
inside the repository layer.

## A.2 The mega-query pattern: collapse read → decide → write → shape into one round trip

The core efficiency pattern: instead of (1) SELECT to check state, (2) check
permission in Go, (3) UPDATE/INSERT/DELETE, (4) SELECT again to build the
response shape — as 2–4 separate network round trips to Postgres — do all of
it **in one SQL statement** using CTEs, and return one row that carries
both the "what happened" signals and the final JSON payload.

Structure (see `courses.queries.go` → `UpdateCourse`, `EnrollFree`,
`courses.repository.crud.go` → `UpdateRepository` for the full worked
example):

```sql
WITH target_row AS (
    -- Step 1: read what you need to make decisions (ownership, existence,
    -- current state) — SELECT, not a subquery buried later.
    SELECT tutor_id, image_url AS old_image_url FROM courses WHERE id = $1
),
status_check AS (
    -- Step 2 (optional): collapse multiple permission/validity checks into
    -- one small integer status code, evaluated with CASE/WHEN in priority
    -- order — first failing condition wins. This becomes the "which error"
    -- signal read back in Go (see A.4).
    SELECT CASE
        WHEN NOT EXISTS (SELECT 1 FROM target_row) THEN 0   -- not found
        WHEN NOT (SELECT is_free FROM target_row) THEN 1    -- wrong state
        ELSE 2                                               -- ok
    END AS status_code
),
mutated AS (
    -- Step 3: do the write, gated on the earlier decision so a failed
    -- precondition mutates nothing (WHERE ... status_check.status_code = 2).
    UPDATE courses SET ... WHERE id = $1 AND tutor_id = $2
    RETURNING *
)
-- Step 4: shape the final response as JSON in the same statement, pulling
-- from both the "did it happen" columns and the mutated/joined data.
SELECT
    (SELECT tutor_id FROM target_row) AS db_tutor_id,
    (SELECT row_to_json(m) FROM (SELECT mutated.*, (subquery for computed field) FROM mutated) m) AS updated_data
FROM (SELECT 1) dummy
LEFT JOIN mutated ON true;
```

For **read-heavy nested trees** (e.g. course → chapters → lessons, or a
paginated list with joined instructor/category), the same collapsing
applies without any mutation — one `jsonb_build_object` / `jsonb_agg` per
level, nested, built bottom-up:

```sql
SELECT jsonb_build_object(
    'id', c.id, 'title', c.title,
    'chapters', (
        SELECT COALESCE(jsonb_agg(chapters_tree ORDER BY chapters_tree.chapter_no), '[]'::jsonb)
        FROM (
            SELECT ch.id, ch.title,
                (SELECT COALESCE(jsonb_agg(lessons_tree ORDER BY lessons_tree.lesson_no), '[]'::jsonb)
                 FROM (SELECT l.id, l.title FROM lessons l WHERE l.chapter_id = ch.id) lessons_tree
                ) AS lessons
            FROM chapters ch WHERE ch.course_id = c.id
        ) chapters_tree
    )
) FROM courses c WHERE c.id = $1;
```

Why: one network round trip to Postgres instead of N (N = 1 + one per
nested collection, potentially recursive per row without this). Every list
endpoint that returns `{total, data}` also computes `total` via a `COUNT(*)`
in the **same** statement, not a separate query.

**Dynamic WHERE clauses** (filters, search, pagination) use a small
positional-argument builder instead of hand-rolled string concatenation —
see `internals/pkg/postgres/filter.go`:

```go
type QueryFilter struct {
    conditions []string
    Args       []any
}
func NewFilter(initialArgs ...any) *QueryFilter { ... }
func (f *QueryFilter) NextIdx() int { return len(f.Args) + 1 }
// Add formats clauseFormat with the next $N and appends val to Args.
func (f *QueryFilter) Add(clauseFormat string, val any) *QueryFilter { ... }
// Add2: same $N used twice in one clause (e.g. an OR ILIKE on two columns), one Args append.
func (f *QueryFilter) Add2(clauseFormat string, val any) *QueryFilter { ... }
func (f *QueryFilter) AddRaw(clause string) *QueryFilter { ... }   // static clause, no arg
func (f *QueryFilter) AddArgs(args ...any) *QueryFilter { ... }    // append LIMIT/OFFSET args w/o a condition
func (f *QueryFilter) Join(defaultClause string) string { ... }    // "AND"-joined conditions
```

Repository call site:

```go
filter := postgres.NewFilter()
filter.AddRaw("c.status = 'published'")
if categoryID != "" { filter.Add("c.category_id = NULLIF($%d, '')::uuid", categoryID) }
if search != ""     { filter.Add2("(c.title ILIKE $%d OR c.short_description ILIKE $%d)", "%"+search+"%") }
limitIdx := filter.NextIdx()
filter.AddArgs(limit, offset)
result, err := postgres.QueryJSON[Payload](ctx, db, BuildListQuery(filter.Join(""), limitIdx), filter.Args...)
```

Never interpolate a filter *value* into the SQL string — only the
already-`$N`-formatted clause text goes into `fmt.Sprintf`; every value is
still passed positionally through `Args`.

## A.3 Generic execution + decode helpers (`internals/pkg/postgres/postgres.go`)

One small set of generic functions every repository method funnels through
— repository code never writes `rows.Scan` boilerplate for the JSON cases:

```go
// Single JSON document -> *T
func QueryJSON[T any](ctx, pool, sqlQuery string, args ...any) (*T, error)

// JSON array document -> []T (never nil — empty slice on empty/null)
func QueryJSONSlice[T any](ctx, pool, sqlQuery string, args ...any) ([]T, error)

// INSERT/UPDATE/DELETE with no result set
func Exec(ctx, pool, sqlQuery string, args ...any) error

// Run fn inside a transaction; commits on nil, rolls back otherwise
func WithTx(ctx, pool, fn func(tx pgx.Tx) error) error

// Decode raw JSONB bytes into *T / []T directly (used by the above, and
// directly when a repository method needs manual Scan — e.g. to also read
// non-JSON columns alongside the JSON payload, see A.2's UpdateCourse).
func DecodeJSON[T any](raw []byte) (*T, error)
func DecodeJSONSlice[T any](raw []byte) ([]T, error)
```

**Status-code queries** — the Go-side counterpart to the SQL `status_check`
CTE in A.2 — read back an integer status alongside the payload and map it
to a domain error via a lookup table, in one call:

```go
type StatusErrorMap map[int]error

func QueryWithStatus[T any](ctx, pool, sqlQuery string, errMap StatusErrorMap, args ...any) (*T, error)
func QuerySliceWithStatus[T any](ctx, pool, sqlQuery string, errMap StatusErrorMap, args ...any) ([]T, error)
func QueryIDWithStatus(ctx, pool, sqlQuery string, errMap StatusErrorMap, args ...any) (string, error)
func QueryStatusOnly(ctx, pool, sqlQuery string, errMap StatusErrorMap, args ...any) error
```

Repository call site (see `courses.repository.enrollment.go`):

```go
func (a *App) EnrollFreeRepository(ctx context.Context, userID, courseID string) error {
    return postgres.QueryStatusOnly(ctx, a.DB, EnrollFree, postgres.StatusErrorMap{
        0: generic.ErrCoursesCourseNotFound,
        1: generic.ErrCoursesNotFree,
        2: generic.ErrCoursesAlreadyEnrolled,
        // 3 (success) has no entry -> falls through to nil error
    }, courseID, userID)
}
```

For the manual-`Scan` case where a mutation needs to return *both* a
non-JSON "did this even match a row I own" signal and a JSON payload (the
`UpdateCourse` example in A.2), the repository method scans the extra
columns itself, then runs the ownership/existence checks through:

```go
type Condition struct { Failed bool; Err error }
func CheckConditions(conds ...Condition) error // first Failed=true wins, else nil
```

```go
err := a.DB.QueryRow(ctx, UpdateCourse, id, tutorID, ...).
    Scan(&dbTutorID, &oldImageURL, &oldPreviewVideoURL, &updatedData)
if err != nil { return nil, nil, postgres.MapPgError(err) }

if err := postgres.CheckConditions(
    postgres.Condition{Failed: dbTutorID == nil, Err: generic.ErrCoursesCourseNotFound},
    postgres.Condition{Failed: len(updatedData) == 0, Err: generic.ErrCoursesAccessDenied},
); err != nil {
    return nil, nil, err
}
return postgres.DecodeJSON[Course](updatedData)
```

## A.4 Error handling: three fixed layers

**Layer 1 — SQLSTATE → generic domain sentinel** (`MapPgError`, same file).
A fixed, small set of driver-level sentinels every query error collapses
into — this is the "fixed number of issues, same message" idea applied at
the lowest layer:

```go
var (
    ErrNotFound     = errors.New("requested resource not found")
    ErrForbidden    = errors.New("access denied for entity")
    ErrInvalidState = errors.New("invalid state machine transition")
    ErrConflict     = errors.New("resource conflict or constraint violation")
    ErrInternalDB   = errors.New("unexpected database error")
)

func MapPgError(err error) error {
    if err == nil { return nil }
    if errors.Is(err, pgx.ErrNoRows) { return ErrNotFound }
    var pgErr *pgconn.PgError
    if errors.As(err, &pgErr) {
        switch pgErr.Code {
        case "02000": return fmt.Errorf("%w: %s", ErrNotFound, pgErr.Message)
        case "42501": return fmt.Errorf("%w: %s", ErrForbidden, pgErr.Message)
        case "23505": return fmt.Errorf("%w: %s", ErrConflict, pgErr.Message)
        case "P0001", "P0002": return fmt.Errorf("%w: %s", ErrInvalidState, pgErr.Message)
        default: return fmt.Errorf("%w [SQLSTATE %s]: %s", ErrInternalDB, pgErr.Code, pgErr.Message)
        }
    }
    return err
}
```

**Layer 2 — per-feature sentinel catalog** (`internals/generic/constants.go`).
Every feature declares its own small, closed set of named sentinel errors
in one shared file, grouped by feature with a comment header:

```go
// Courses errors
var (
    ErrCoursesCourseNotFound = errors.New("course not found")
    ErrCoursesNotEnrolled    = errors.New("not enrolled in this course")
    ErrCoursesAccessDenied   = errors.New("access denied")
    ErrCoursesNotFree        = errors.New("course is not free")
)
```

These are what `status_code`/`Condition` checks in the repository layer
return (A.2/A.3) — the repository's only job re: errors is picking the
right sentinel, never formatting a user-facing message.

**Layer 3 — service layer maps sentinel → HTTP-shaped `APIError`**
(`internals/utils/errors.go` + each `<feature>.services.go`). One error
type carries status + client message + the original cause (for logging
only, never serialized):

```go
type APIError struct { Status int; Message string; Err error }
func (e *APIError) Error() string { return e.Message }
func (e *APIError) Unwrap() error { return e.Err }

func ErrNotFound(message string, err error) *APIError    { return NewError(404, message, err) }
func ErrForbidden(message string, err error) *APIError   { return NewError(403, message, err) }
func ErrBadRequest(message string, err error) *APIError  { return NewError(400, message, err) }
func ErrConflict(message string, err error) *APIError    { return NewError(409, message, err) }
func ErrInternal(message string, err error) *APIError    { return NewError(500, message, err) }
// ... ErrValidation (422), ErrUnauthorized (401), ErrTooManyRequests (429)
```

Every service method is one `errors.Is` chain, each sentinel mapped to
exactly one client-facing message, with a catch-all last:

```go
func (a *App) Study(ctx context.Context, courseID, userID string) (*CourseStudyResponse, error) {
    resp, err := a.StudyMetadataRepository(ctx, courseID, userID)
    if err != nil {
        if errors.Is(err, generic.ErrCoursesCourseNotFound) {
            return nil, utils.ErrNotFound("Course not found.", err)
        }
        if errors.Is(err, generic.ErrCoursesNotEnrolled) {
            return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
        }
        return nil, utils.ErrInternal("Failed to fetch study page.", err)
    }
    return resp, nil
}
```

**Rendering** — one central Fiber `ErrorHandler` (wired at app construction,
not per-handler) is the *only* place a status code or JSON error body gets
written:

```go
func ErrorHandler(c *fiber.Ctx, err error) error {
    var apiErr *APIError
    if errors.As(err, &apiErr) {
        return json[any](c, apiErr.Status, false, apiErr.Message, nil, apiErr.Err)
    }
    // framework-level errors (404 route, panic, body-size limit) fall back
    // to one generic message; the real error is logged via c.Locals, never leaked.
    code := fiber.StatusInternalServerError
    if fe, ok := err.(*fiber.Error); ok { code = fe.Code }
    c.Locals("handler_error", err)
    return json[any](c, code, false, "An unexpected error occurred.", nil, nil)
}
```

Controllers/handlers never construct an error response body themselves —
they `return` an `*APIError` (or any error) up the chain and Fiber routes
it here.

## A.5 Feature layering recap

```
<feature>.queries.go       -> const SQL strings + Build*Query(...) functions (A.1, A.2)
<feature>.repository*.go   -> calls postgres.QueryJSON/QueryWithStatus/etc, returns (T, sentinel-error) (A.3)
<feature>.services.go      -> errors.Is chain, sentinel -> utils.APIError with client message (A.4)
<feature>.controllers.go   -> parse request, call service, shape HTTP response — never touches SQL or sentinels
<feature>.entity.go        -> request/response structs with json tags matching the JSON builder's keys
```

---

# Part B — React Query Layer (frontend)

## B.1 Folder shape

```
src/
  react-query/
    client.ts       # axios instance + interceptors + apiRequest<T>() generic request fn
    query.ts         # useAppQuery — generic wrapper over useQuery
    mutation.ts       # useSimpleMutation / useObjectMutation / useArrayMutation / usePaginatedMutation
    query-keys.ts     # queryKeys — one factory object, every cache key defined once
  query-hooks/
    <feature>.api.ts  # one file per backend resource: exported hooks only, no JSX
  schema/
    <feature>.types.ts  # Zod schemas + z.infer types for that resource
    common.types.ts    # ApiResponseZod, PaginatedResponseZod — shared envelope schemas
```

Rule: `react-query/` is generic infrastructure with zero domain knowledge —
it never imports a feature schema. `query-hooks/*.api.ts` is 100% domain —
it never talks to axios directly, only through `apiRequest` + the generic
hook wrappers.

## B.2 The generic request function (`react-query/client.ts`)

One function every query/mutation funnels through. It attaches auth (B.4),
validates the response shape with Zod, and normalizes every failure mode
(network error, non-2xx, schema mismatch) into the **same success/failure
envelope** so callers never branch on exception vs. return value:

```ts
export async function apiRequest<T>(config: AxiosRequestConfig, schema: z.ZodType<T>): Promise<ApiResponse<T>> {
    try {
        config.headers = { ...config.headers, "Content-Type": "application/json" };
        const response = await api.request(config);
        return ApiResponseZod(schema).parse(response.data);   // <-- strict Zod parse of the whole envelope
    } catch (error) {
        let message = ERROR_MESSAGES.UNEXPECTED;
        let detailedError = String(error);
        if (axios.isAxiosError(error)) {
            message = error.response?.data?.message || error.message;
            detailedError = error.response?.data?.error || error.code || detailedError;
        } else if (error instanceof z.ZodError) {
            message = ERROR_MESSAGES.VALIDATION_FAILED;
        } else if (error instanceof Error) {
            message = error.message;
        }
        return { success: false, message, data: null, error: detailedError }; // same shape as success
    }
}
```

The backend's `{success, message, data, error}` envelope (Part A.4's
`json[any](...)` helper) is mirrored exactly by a shared Zod schema
(`schema/common.types.ts`):

```ts
export const ApiResponseZod = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.optional().nullable(),
    error: z.string().optional().nullable(),
});
export const PaginatedResponseZod = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({ data: z.array(dataSchema), total: z.number(), page: z.number(), limit: z.number() });
```

Every `.api.ts` hook passes its own resource schema (e.g. `CourseZod`) as
`schema`, so `apiRequest<Course>` returns `ApiResponse<Course>` and every
field is runtime-validated, not just TypeScript-typed — a shape drift
between backend and frontend fails loudly instead of silently propagating
`undefined`s into components.

## B.3 Generic query/mutation wrappers

**Query** (`react-query/query.ts`) — thin wrapper over `useQuery` that adds
dev-only success/error logging; every read hook in `query-hooks/*.api.ts`
goes through this, never `useQuery` directly:

```ts
export function useAppQuery<TData, TError = Error>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
    const query = useQuery<TData, TError>({ queryKey, queryFn, ...options });
    useEffect(() => { /* dev-mode console log on success/error */ }, [...]);
    return query;
}
```

**Mutation** (`react-query/mutation.ts`) — four hooks, escalating in cache
sophistication, all sharing one `execute()` wrapper (dedupes concurrent
calls via a ref, swallows the throw so callers check the returned
`ApiResponse` instead of try/catching):

| Hook | Use when | Cache behavior |
|---|---|---|
| `useSimpleMutation` | mutation doesn't need to touch the cache directly | toast + optional `invalidateKeys` |
| `useObjectMutation` | mutation replaces one cached object wholesale | `setQueryData(key, response)` |
| `useArrayMutation` | mutation updates one item in a plain array cache | `updater` + optional `optimistic` + rollback |
| `usePaginatedMutation` | same, for a `{data, total}` paginated cache | same, with total-count-aware helpers |

`useArrayMutation`/`usePaginatedMutation` both delegate to one internal
`useCacheMutation<TData, TVars, TCache>` — same `onMutate/onSuccess/onError`
logic, generic over the cache shape. **Optimistic update + rollback**:

```ts
onMutate: async (vars) => {
    if (!opts.optimistic) return undefined;
    await queryClient.cancelQueries({ queryKey: opts.queryKey });
    const snapshot = { queryKey: opts.queryKey, data: queryClient.getQueryData(opts.queryKey) };
    applyUpdater(queryClient, opts.queryKey, opts.optimistic(vars));  // apply optimistic change immediately
    return snapshot;                                                  // returned as mutation context
},
onSuccess: (response) => {
    const data = handleResponse(response, opts.showToast);           // toast + unwrap
    if (data != null) applyUpdater(queryClient, opts.queryKey, opts.updater(data)); // reconcile with server truth
},
onError: (error, _vars, snapshot) => {
    handleError(error);
    if (snapshot) queryClient.setQueryData(snapshot.queryKey, snapshot.data); // roll back to pre-mutation snapshot
},
```

Small composable cache-updater functions cover the common list operations
so `.api.ts` files never hand-write cache-mutation logic:

```ts
export const appendToArray/prependToArray/replaceInArray/removeFromArray = ...
export const appendToPaginated/prependToPaginated/replaceInPaginated/removeFromPaginated = ...
```

## B.4 Centralized query keys

One object, one factory per resource, every key built through it — no
inline `["courses", id]` arrays scattered across components:

```ts
export const queryKeys = {
    courses: (params?: Record<string, string | number>) => params ? ["courses", params] as const : ["courses"] as const,
    courseById: (id: string) => ["courses", id] as const,
    coursesEnrolled: () => ["courses", "enrolled"] as const,
    // ... one line per resource/variant
};
```

## B.5 `query-hooks/<feature>.api.ts` shape

Every file is pure exported hooks — a query hook per GET variant, a
mutation hook per write — built entirely from B.2–B.4's primitives:

```ts
"use client";
import { apiRequest } from "@/react-query/client";
import { useSimpleMutation, usePaginatedMutation, removeFromPaginated } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { CourseZod, CreateCourseRequestZod } from "@/schema/courses.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

export function useManageCoursesQuery(params?: {...}) {
    const url = /* build querystring from params */;
    return useAppQuery(queryKeys.coursesManage(params), () =>
        apiRequest({ url, method: "GET" }, PaginatedResponseZod(CourseZod)));
}

export function useCreateCourseMutation() {
    return useSimpleMutation({
        mutationFn: (data: z.infer<typeof CreateCourseRequestZod>) =>
            apiRequest({ url: "/courses", method: "POST", data }, CourseZod),
        invalidateKeys: [queryKeys.courses(), queryKeys.coursesManage()],
        showToast: true,
    });
}

export function useDeleteCourseMutation() {
    return usePaginatedMutation({
        mutationFn: (id: string) => apiRequest({ url: `/courses/${id}`, method: "DELETE" }, DeleteResponseZod),
        queryKey: queryKeys.courses(),
        invalidateKeys: [queryKeys.coursesManage()],
        updater: (res) => removeFromPaginated(res.id),
        optimistic: (id) => removeFromPaginated(id),   // list item disappears instantly, rolls back on failure
        showToast: true,
    });
}
```

Component call site never sees axios, Zod, or React Query internals:

```ts
const { data, isLoading } = useManageCoursesQuery({ page, limit });
const { execute: createCourse } = useCreateCourseMutation();
await createCourse(formValues);
```

---

# Part C — JWT: fetch once, store in Zustand, read via `getState()`

## C.1 The rule

Fetch/mint the JWT **exactly once**, on first app load (or on explicit
sign-in / sign-out / refresh), store it in a Zustand store, and have the
axios layer read it through `useSessionStore.getState().token` — the
non-hook accessor — so the interceptor (which runs outside any component,
on every request) never needs to re-fetch or subscribe.

## C.2 The store (`store/session.store.ts`)

Plain Zustand store, no persistence middleware (session lives for the tab's
lifetime, re-derived from the backend on reload) — see B/A's `isPending`
flag used to gate rendering until the first fetch resolves:

```ts
interface SessionState {
    user: SessionUser | null;
    token: string | null;
    roles: string[];
    permissions: string[];
    isPending: boolean;               // true until the first fetch resolves
    setSessionPayload: (payload: SessionPayload) => void;
    clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    user: null, token: null, roles: [], permissions: [], isPending: true,
    setSessionPayload: (payload) => set({ ...payload, isPending: false }),
    clear: () => set({ user: null, token: null, roles: [], permissions: [], isPending: false }),
}));
```

## C.3 Fetch-once hook (`hooks/use-session.ts`)

A `useRef` guard ensures the fetch effect runs at most once per mount of
the top-level provider, regardless of re-renders, and is skipped entirely
if a token is already present in the store:

```ts
export default function useSession() {
    const hydratedRef = useRef(false);
    const token = useSessionStore((s) => s.token);
    const setSessionPayload = useSessionStore((s) => s.setSessionPayload);
    const clear = useSessionStore((s) => s.clear);

    const refreshSession = useCallback(async () => {
        const payload = await fetchSessionFromAuthServer();  // however this project mints/verifies JWTs
        if (payload.user) { setSessionPayload(payload); return payload; }
        clear();
        return null;
    }, [setSessionPayload, clear]);

    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;
        if (!token) refreshSession();     // only fetch if the store doesn't already have one
    }, [token, refreshSession]);

    return { token, refreshSession, clear, /* ...user, roles, permissions, isPending */ };
}
```

Decode whatever claims the token carries (role, must-change-password flag,
etc.) at fetch time, once, rather than decoding on every read:

```ts
function buildSessionPayload({ user, jwtToken }): SessionPayload {
    const claims = jwtToken ? jwtDecode<CustomJwtPayload>(jwtToken) : null;
    return { user, token: jwtToken, roles: claims?.roles ?? [], mustChangePassword: Boolean(claims?.must_change_password) };
}
```

## C.4 Reading the token outside React: the axios interceptor

This is the payoff of using Zustand over Context: `.getState()` reads the
current value **without a hook**, so the interceptor — which is not a
component and must not re-fetch per request — just reads whatever the
store currently holds:

```ts
api.interceptors.request.use((config) => {
    const token = useSessionStore.getState().token;   // <-- getState(), not the hook
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// A 401 means the token is stale/invalid: clear it and bounce to login.
// This is the ONLY other place the token is refetched — never inside apiRequest.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            useSessionStore.getState().clear();
            if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
        }
        return Promise.reject(error);
    },
);
```

## C.5 Wiring the fetch-once hook at the app root

One top-level provider component calls `useSession()` (which internally
runs the once-guarded fetch effect from C.3) and blocks rendering on
`isPending` for protected routes only — public routes render immediately
without waiting on the session fetch:

```tsx
export function SessionProvider({ children }) {
    const { user, isPending, permissions } = useSession();
    // ... redirect logic based on user/permissions/pathname ...
    if (isPending && !isPublicPath) return <Spinner />;
    return children;
}
// mounted once, near the root layout — every descendant route/component
// reads session state via the useSessionStore selector hooks (reactive),
// while non-component code (axios) reads via getState() (C.4).
```

---

# Part D — Rebuild checklist for a new project

Backend (any language with a SQL driver + a web framework with a central
error-handler hook):
- [ ] One folder per feature; inside it, one file whose only job is
      returning SQL strings/functions (`<feature>.queries.go` equivalent).
- [ ] For any read-then-decide-then-write endpoint, write it as a single
      CTE chain returning one row, not N sequential queries.
- [ ] For any nested-list read, build the JSON tree bottom-up inside SQL
      (`jsonb_build_object`/`jsonb_agg` or the target DB's equivalent), not
      N+1 application-side loops.
- [ ] One small set of driver-error → domain-sentinel mappings (Layer 1,
      A.4), reused everywhere.
- [ ] One per-feature sentinel-error catalog (Layer 2, A.4) — the
      repository layer only ever returns these, never ad-hoc strings.
- [ ] One `APIError{status, message, cause}` type + one central error
      renderer wired into the framework's error hook (Layer 3, A.4) —
      no handler writes a status code or JSON error body directly.
- [ ] A tiny generic-args query filter/builder for dynamic WHERE clauses
      that never string-concatenates a raw value (A.2).
- [ ] Generic `QueryJSON[T]`/`QueryJSONSlice[T]`/`QueryWithStatus[T]`-style
      helpers so repository methods are ~5 lines each (A.3).

Frontend (any React + React Query + a schema-validation library + a
lightweight state store):
- [ ] One `apiRequest<T>(config, schema)` function: does the HTTP call,
      validates the *entire* response envelope against a schema, normalizes
      every failure mode into the same return shape as success (B.2).
- [ ] One shared envelope schema (`{success, message, data, error}` or
      whatever the backend's central error renderer emits) mirrored on the
      frontend exactly (B.2).
- [ ] One `useAppQuery` wrapper over the query library's base hook (B.3).
- [ ] A small family of mutation wrappers layered by cache sophistication
      (no-cache-touch → single-object → list-with-optimistic-update), all
      sharing one execute/dedupe core (B.3).
- [ ] One centralized query-key factory object — no inline key arrays at
      call sites (B.4).
- [ ] One `<feature>.api.ts` per backend resource, hooks-only, zero direct
      axios/fetch or schema-parsing calls outside `apiRequest` (B.5).
- [ ] One `<feature>.types.ts` per resource with schema + inferred type,
      colocated with its query-hooks file's imports.

JWT/session:
- [ ] One global store (Zustand or equivalent) holding `token` + derived
      claims + an `isPending` flag.
- [ ] One fetch-once hook guarded by a ref, run from exactly one top-level
      provider component, skipped when a token already exists in the store.
- [ ] The HTTP client's auth-header interceptor reads the token via the
      store's **non-hook** state accessor (`getState()`) — never re-fetches,
      never requires being inside a component.
- [ ] A 401-response interceptor is the only *other* trigger that clears
      the store/token (besides explicit sign-out) — not a retry loop, not a
      per-request refresh.
