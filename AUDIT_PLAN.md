# CourseHunt API — Comprehensive Optimization & Audit Plan

## CTE-First Approach (Standard for this project)

All DB operations in this project MUST use **PostgreSQL CTEs with json_builder** — a single SQL query per operation, regardless of how many tables are read/written. This is already the established pattern across every repository (feedbacks, chapters, lessons, notes, enrollments, discussions, etc.).

### Why CTEs instead of transactions:
- **Single round-trip** — multiple DML operations in one query, eliminating network overhead
- **Atomic by definition** — a single query either succeeds or fails entirely (PG wraps it in an implicit transaction)
- **No manual rollback boilerplate** — no `tx.Rollback()` on every error path
- **JSON response building** — `json_build_object` / `json_agg` in RETURNING CTEs build the exact response shape in SQL, no Go-side struct marshaling
- **Data can flow between CTEs** — `RETURNING` output of one CTE feeds the next
- **Matches codebase convention** — every repo already uses `WITH ... INSERT/DELETE/UPDATE ... RETURNING row_to_json(...)`
- **Connection held for minimal time** — one query in, one result out

### Rule of thumb:
- Two+ dependent writes → single CTE query
- Write + read-back → CTE with RETURNING + json_build_object
- Complex branching logic → restructure into CTEs, not Go-side conditionals
- Never use `BEGIN`/`COMMIT` in raw SQL strings
- Never use `sqlx` transactions for multi-table writes

---

## A. Network Call Optimization (Reducing DB Round-Trips)

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| A1 | **Duplicate coupon lookup** — `InitiateService` calls `CheckCoupon` (which internally calls `ReadByCodeRepository`) then calls `ReadByCodeRepository` again | `transactions/transactions.service.go:44,52` | 1 extra DB round-trip per checkout with coupon | Extend `CheckCouponResponse` to include `CouponID` |
| A2 | **Roles: two sequential DELETEs** — `DELETE role_permissions` then `DELETE roles` in separate Exec calls | `roles/roles.repository.go:73-80` | 2 round-trips + no atomicity | Single CTE: `WITH del_perms AS (DELETE FROM role_permissions WHERE role_id = $1 RETURNING 1), del_role AS (DELETE FROM roles WHERE id = $1 RETURNING id) SELECT id FROM del_role` |
| A3 | **Updates FeedRepository destructive pattern** — `DELETE FROM update_seen WHERE user_id` then `INSERT INTO update_seen` on every read | `updates/updates.repository.go:77-149` | 2 writes per read + all seen history destroyed | Single CTE with upsert: `INSERT INTO update_seen (user_id, update_id) VALUES ($1, $2) ON CONFLICT (user_id, update_id) DO UPDATE SET seen_at = NOW() RETURNING ...` |
| A4 | **Lesson ReadContentRepository writes on every read** — `updated_enrollment` CTE updates `enrollments.last_accessed_lesson_id` every time a lesson is viewed | `lessons/lessons.repository.content.go:39-97` | 1 write per lesson view, can cause contention | Batch writes or debounce |
| A5 | **Lesson progress: separate write per lesson completion** — `MarkLessonComplete` and `UpdateChapterProgress` are separate SQL calls | `lessons/lessons.repository.progress.go` | 2 round-trips per lesson completion | Combine into one CTE: `WITH prog AS (INSERT INTO lesson_progress ... ON CONFLICT DO UPDATE RETURNING ...), ch AS (UPDATE chapter_progress SET ... WHERE ...) SELECT json_build_object(...)` |
| A6 | **CheckoutController fetches course data** — but `InitiateService` also fetches `GetCoursePriceRepository` | `transactions/transactions.controller.go:81` + `transactions/transactions.service.go:32` | 1 extra query on checkout page load | Cache course data or pass from checkout |

## B. Performance Flaws (Slow Queries)

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| B1 | **Wishlist — no pagination**, returns ALL items | `wishlist/wishlist.repository.go:20-47` | Degrades with user's wishlist growth | Add LIMIT/OFFSET with cursor or pagination |
| B2 | **Quiz evaluation — 3 correlated subqueries per question** (options, arrange, fill-blank) | `quiz/quiz.repository.taking.go:125-208` | 150 subqueries for 50-question quiz | Use joined lateral or batch query |
| B3 | **ORDER BY RANDOM() LIMIT 1** — scans and sorts all quiz questions to pick one | `quiz/quiz.repository.taking.go:39` | Full table scan per question request | Use `TABLESAMPLE` or pre-shuffle |
| B4 | **Category list — correlated subquery per root category for subcategories** | `category/categories.repository.go:25-63` | N+1 within SQL | Use `LEFT JOIN` + `GROUP BY` + `json_agg` |
| B5 | **Course tutor list — correlated subquery per course for student_count** | `courses/courses.repository.tutor.go:11-94` | N+1 for tutor's course list | Use `LEFT JOIN` + `GROUP BY` |
| B6 | **User list — correlated subquery per user for roles** | `users/users.repository.go:19-88` | N+1 for admin user list | Use `LEFT JOIN` + `GROUP BY` |
| B7 | **Dashboard admin — 7+ independent subqueries** scanning same tables | `dashboard/dashboard.repository.go` | Multiple sequential scans of users, transactions, etc. | Combine into shared CTEs |
| B8 | **TOCTOU race: role fetched twice** — once for `IsSystem` check, once for mutation | `roles/roles.controller.go:43,69,102` | 2 round-trips | CTE with RETURNING to fetch + mutate in one query |

## C. Missing Database Indexes

| Table | Index | Type | Critical For |
|-------|-------|------|-------------|
| `transactions` | `(razorpay_order_id)` | UNIQUE | Razorpay webhook order lookups |
| `coupons` | `(code)` | UNIQUE | Coupon code lookups |
| `courses` | `(slug)` WHERE status='published' | INDEX | Public course page |
| `enrollments` | `(user_id, revoked)` | INDEX | Dashboard + enrolled courses |
| `enrollments` | `(course_id, enrolled_at DESC)` | INDEX | Enrollment list |
| `enrollments` | `(course_id, revoked)` | INDEX | Enrollment count queries |
| `enrollments` | `(user_id, revoked, enrolled_at DESC)` | INDEX | Enrolled courses list |
| `transactions` | `(user_id, created_at DESC)` | INDEX | User transaction history |
| `transactions` | `(course_id, created_at DESC)` | INDEX | Course transaction history |
| `transactions` | `(status, created_at DESC)` | INDEX | Admin filtering + dashboard |
| `transactions` | `(created_at DESC)` | INDEX | Date range filters |
| `discussions` | `(lesson_id, parent_id)` | INDEX | Discussion listing |
| `discussions` | `(parent_id)` | INDEX | Reply listing |
| `discussions` | `(lesson_id, created_at DESC)` | INDEX | Discussion order |
| `quiz_questions` | `(quiz_id)` | INDEX | Quiz evaluation |
| `quiz_options` | `(question_id, is_correct)` | INDEX | Quiz evaluation |
| `quiz_arrange_items` | `(question_id)` | INDEX | Quiz evaluation |
| `quiz_fill_blank_answers` | `(question_id)` | INDEX | Quiz evaluation |
| `quiz_attempts` | `(quiz_id, user_id)` | INDEX | Attempt lookup |
| `quiz_metadata` | `(lesson_id)` | UNIQUE | Quiz lookup |
| `feedbacks` | `(course_id, user_id)` | UNIQUE | ON CONFLICT target |
| `feedbacks` | `(is_pinned, created_at DESC)` | INDEX | Pinned feedback listing |
| `feedbacks` | `(course_id, created_at DESC)` | INDEX | Feedback listing |
| `lessons` | `(chapter_id, lesson_no)` | INDEX | Chapter lesson listing |
| `chapters` | `(course_id, chapter_no)` | INDEX | Course chapter listing |
| `categories` | `(name)` WHERE parent_id IS NULL | INDEX | Root category listing |
| `categories` | `(parent_id)` | INDEX | Subcategory lookup |
| `wishlists` | `(user_id, added_at DESC)` | INDEX | Wishlist listing |
| `wishlists` | `(user_id)` | INDEX | Wishlist delete/clear |
| `lesson_video_content` | `(lesson_id)` | UNIQUE | Content lookup |
| `lesson_document_content` | `(lesson_id)` | UNIQUE | Content lookup |
| `lesson_resources` | `(lesson_id)` | INDEX | Resource lookup |
| `certificates` | `(user_id, issued_at DESC)` | INDEX | Certificate list |
| `chapter_progress` | `(chapter_id, user_id)` | UNIQUE | Progress tracking |
| `lesson_progress` | `(lesson_id, user_id)` | UNIQUE | Progress tracking |
| `update_seen` | `(user_id)` | INDEX | Updates feed |
| `webhook_events` | `(razorpay_event_id)` | UNIQUE | Webhook dedup |
| `coupon_usages` | `(coupon_id, user_id, course_id)` | UNIQUE | Usage recording |
| `coupons` | `(course_id)` | INDEX | Coupon list |
| `course_updates` | `(created_at DESC)` | INDEX | Updates listing |
| `course_updates` | `(course_id, created_at DESC)` | INDEX | Updates feed |
| `user_roles` | `(user_id)` | INDEX | User role queries |
| `role_permissions` | `(role_id)` | INDEX | Role permission queries |
| `"user"` | `(created_at DESC)` | INDEX | User listing order |
| `"user"` | `(email)` | INDEX | User search/filter |

## D. Security Flaws

| # | Issue | Location | Severity | Fix |
|---|-------|----------|----------|-----|
| D1 | **Bare type assertion on `c.Locals("permission")`** — can panic if PermissionGuard is omitted | `feedbacks/feedbacks.controller.go:30`, `enrollments/enrollments.controller.go:20`, `transactions/transactions.controller.go:91` | HIGH | Use comma-ok form, return 403 |
| D2 | **`resolveScope` defaults to `ScopeTutor`** when permission is nil — privilege escalation | `chapters/chapters.service.go`, `lessons/lessons.service.go`, `courses/courses.service.go`, `discussions/discussions.service.go` | HIGH | Default to `ScopeUser` or return error |
| D3 | **Missing course ownership checks** — chapters create, updates CRUD, feedbacks delete/update | Multiple controllers | MEDIUM | Add owner verification via auth CTE in repos |
| D4 | **Categories CRUD has `admin:` routes but no PermissionGuard in controller** | `category/categories.controller.go` | MEDIUM | Add guard or verify route middleware |
| D5 | **Coupon `CheckController` is unauthenticated** — allows brute-force coupon guessing | `coupons/coupons.controller.go:57` | MEDIUM | Add auth + rate limit |
| D6 | **Discussions/Transactions error responses bypass standard envelope** | `discussions/discussions.controller.go`, `transactions/transactions.controller.go` | LOW | Use `utils` helpers |
| D7 | **PermissionGuard returns `{"error":"..."}`** instead of standard envelope | `middlewares/auth.go:166` | LOW | Use `utils.Forbidden` |

## E. Bugs

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| E1 | **`Response.Error` type is `error`** — serializes as `{}`, error message lost to client | `generic/type.go`, `utils/response.go` | All error responses lose the error payload | Change to `string`, convert in helper |
| E2 | **`enrollments.controller.go` passes `userID` twice** — 5th and 6th params are both the same value | `enrollments/enrollments.controller.go:22` | Admin/tutor enrollment inspection broken | Pass `userID` as 5th, correct value as 6th |
| E3 | **Quiz scoring: `totalPoints` inconsistently handled** — skipping a non-existent question adds points | `quiz/quiz.service.go:33-39` | Score inflation possible | Standardize: non-existent questions contribute 0 |
| E4 | **Fill-blank answer doesn't trim whitespace** | `quiz/quiz.service.go:56` | `" answer "` ≠ `"answer"` | Add `strings.TrimSpace` |
| E5 | **Chapters entity: `CourseID` has no `validate:"required"`** | `chapters/chapters.entity.go:23` | Poor DX on validation | Add `validate:"required"` |
| E6 | **Updates FeedRepository deletes ALL seen records on every read** | `updates/updates.repository.go` | Seen history lost per load | Use CTE with upsert instead of DELETE+INSERT |

## F. Computation / Memory Waste

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| F1 | **`GetUserFromCtx` copies full `UserContext` struct** (value assertion + heap escape) — 88+ times per request | `utils/getUserId.go:19` | ~1KB heap alloc × 88 = measurable GC pressure | Store `*UserContext` pointer in middleware |
| F2 | **`RETURNING *` in CRUD repositories** returns all columns when only subset needed | Multiple repository files | Extra data marshaled over wire | Return only needed columns |
| F3 | **Slugify timestamp is low entropy** `%100000` — collision risk under concurrent writes | `utils/strings.go:22` | Theoretical slug collision | Use `uuid` or higher entropy |

## G. Inconsistencies & Lack of Standardization

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| G1 | **Error response shape differs across endpoints** — 5 different error formats | PermissionGuard, webhooks, discussions, standard utils | No single error contract |
| G2 | **Auth scope default is `ScopeTutor` vs `ScopeUser`** | Service files vs `ScopeFromPermission` | Two different defaulting strategies |
| G3 | **Controller input validation: some use `utils.Validate`, some use `c.BodyParser` directly** | `feedbacks/feedbacks.controller.go:53` vs rest | `UpdateController` bypasses validation |
| G4 | **User entity uses camelCase JSON** (`emailVerified`, `createdAt`) while every other entity uses snake_case | `users/users.entity.go:19,21` | Forces clients to handle both conventions |
| G5 | **Delete response shape varies**: some return `{"id":"..."}`, others return `{}` | `roles/roles.controller.go:80,118` vs standard pattern | Inconsistent client contract |
| G6 | **Pagination over-limit resets to default (20) instead of clamping to max (100)** | `utils/paginationParams.go:16` | Surprising behavior for API consumers |
| G7 | **OpenAPI spec at `/docs` has empty paths** | `utils/scalar.go` | Useless API documentation |
| G8 | **`AuthErrorForScope` ignores the `scope` parameter** | `generic/authscope.go:34-39` | Misleading function signature |

## H. Razorpay Webhook-Specific Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| H1 | **Webhook: raw text responses** instead of JSON | `transactions/transactions.controller.go:28,48,65,69` | Breaks error envelope contract |
| H2 | **Webhook: unknown events silently acknowledged** | `transactions/transactions.service.go:170-176` | No logging/warning on unknown event types |
| H3 | **No webhook retry limit or dedup monitoring** | `transactions/transactions.service.go` | Razorpay retries handled at DB level only |

## Implementation Order

### Phase 1 — Security & Panic Fixes (DONE)
- [x] D1: Fix bare type assertions (`c.Locals("permission").(string)`)
- [x] D2: Change `resolveScope` defaults from `ScopeTutor` to `ScopeUser`
- [x] E1: Fix `Response.Error` from `error` to `string`
- [x] E2: Fix enrollments admin ownership check (separate admin/tutor paths)

### Phase 2 — Network Call Reduction (CTE-first) (PARTIAL)
- [ ] A1: Fix duplicate coupon lookup in transactions service
- [x] A2: Fix roles delete — single CTE with RETURNING
- [x] A3: Fix updates feed — CTE with upsert (replaces DELETE+INSERT)
- [ ] A5: Removed — `chapter_progress` has no writer; not applicable

### Phase 3 — Database Indexes (DONE)
- [x] C: Created `010_missing_indexes.sql` with 42 indexes across 22 tables

### Phase 4 — Performance Optimizations (PARTIAL)
- [x] B1: Add pagination to wishlist (also fixed flat JSON shape → json_build_object)
- [ ] B2: Optimize quiz evaluation N+1 subqueries
- [ ] B3: Fix ORDER BY RANDOM() in quiz
- [ ] B4-B6: Optimize correlated subqueries — CTE + json_agg
- [x] F1: Fix `GetUserFromCtx` to use pointer (no more full struct copy per call)

### Phase 5 — Consistency & Standardization
- [ ] G1, D6: Unify error response formats across all endpoints
- [ ] G4: Fix camelCase vs snake_case in user entity
- [ ] G5: Standardize delete responses
- [ ] G6: Fix pagination clamping behavior

### Phase 6 — Remaining Items
- [ ] D3: Add course ownership checks via auth CTE in repos
- [ ] D4: Verify category PermissionGuard coverage
- [ ] D5: Add auth requirement to coupon check endpoint
- [ ] E3: Fix quiz scoring inconsistency
- [ ] E4: Add whitespace trimming to fill-blank evaluation
- [ ] E5: Add `validate:"required"` to chapter CourseID
- [ ] F2: Optimize `RETURNING *` to return only needed columns
- [ ] F3: Fix slugify timestamp entropy
- [ ] G8: Remove unused `scope` parameter from `AuthErrorForScope`
- [ ] H1-H3: Fix webhook response format and logging
