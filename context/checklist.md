# Checklist System

---

## Checklist Job (Template)

### Pre-Implementation
* [x] Update current job
* [x] Analyze only relevant files
* [x] Check related modules
* [x] Understand data flow
* [x] Plan implementation
* [x] read the constraints.md file
* [x] read the achitecture.md file
### Post-Implementation
* [x] Update checklist
* [x] Remove unused code
* [x] Check type errors
* [x] Check syntax errors
* [x] Verify flow integrity
* [x] Validate feature working
---
## Current Job
**Job**: Comprehensive System Enhancements: Course Completion, Recent Updates, Parallel Routes, Refund System, Tutor Dashboard, and User Management.
**Status**: In Progress
**Completion %**: 0%

### 1. Work Done
* Initialized task list and started research.

### 2. Files Changed
* `context/checklist.md`

### 3. Completion %
* 0%

### 4. Issues
* None.

### 5. Optimizations
* None.
---
## Tasks to be Done
* [ ] **Task 1: Course Read API & Completion Status**
    * [ ] Fix Course Read API error.
    * [ ] Add `completed` attribute to "all enrolled courses" API.
    * [ ] Update UI to show course completion status.
* [ ] **Task 2: Remove dashboard/course page**
    * [ ] Remove the page and ensure all enrolled courses are visible on the main dashboard.
* [ ] **Task 3: Recent Updates System**
    * [ ] Admin CRUD for updates (date, title, description).
    * [ ] Tracking table for user "seen" status.
    * [ ] Single API to fetch unseen updates and mark as seen.
    * [ ] Dashboard section for recent updates.
* [ ] **Task 4: Dashboard Parallel Routes**
    * [ ] Implement parallel routes for `stats`, `enrolled courses`, and `updates` in the dashboard.
* [ ] **Task 5: Fix Next.js Image Config**
    * [ ] Add `lh3.googleusercontent.com` to `next.config.ts`.
* [ ] **Task 6: Admin Feedback Enhancements**
    * [ ] Add Delete and Pin actions to feedback.
    * [ ] Show pinned feedback in testimonials.
* [ ] **Task 7-9: Transaction Stats & Refund System**
    * [ ] Add stats (Total/Monthly Revenue, Total/Pending Refunds).
    * [ ] Update transaction table with user info and refund status.
    * [ ] Implement Refund workflow (Ideal, Pending, Refunded).
    * [ ] Revoke course access upon refund.
* [ ] **Task 10-11: User Management & Banning**
    * [ ] Cleanup user table (position, joined, courses count).
    * [ ] Add Ban/Unban and Role change actions.
    * [ ] Implement restricted page for banned users.
* [ ] **Task 12-14: Tutor Dashboard & Access Control**
    * [ ] Create Tutor-specific dashboard (Course CRUD, Feedback).
    * [ ] Implement Discussion system (CRUD + UI).
    * [ ] Enforce access control (Admin: all, Tutor: own courses).

---

## Checked Job
### 1. Work Done
* Modified backend `UpdateCourse` handler to perform partial updates by merging incoming data with existing records.
* Added automatic query cache invalidation to all course and coupon mutations in the frontend hooks.
* Fixed coupon creation error by ensuring the frontend sends expiry dates in ISO format.
* Significantly enhanced UI for User Management (admin), Student Dashboard (overview), and Profile pages with modern components and layout.
* Corrected Admin Panel navigation redirect from `/user` to `/dashboard`.
* Generated a comprehensive `06_seed.sql` script for initial database populating.
### 2. Files Changed
* `backend/internals/handlers/v1/course_handler.go`
* `frontend/src/hooks/api/courses-admin.ts`
* `frontend/src/hooks/api/coupons-admin.ts`
* `frontend/src/app/adminpanel/coupons/coupon-form.tsx`
* `frontend/src/app/adminpanel/layout.tsx`
* `frontend/src/app/adminpanel/users/page.tsx`
* `frontend/src/app/dashboard/page.tsx`
* `frontend/src/app/dashboard/profile/page.tsx`
* `backend/internals/migrations/06_seed.sql`
### 3. Completion %
* 100%
### 4. Issues
* "Keywords" removal request was investigated but no such field or label was found in the codebase. Assumed already removed or non-existent.
### 5. Optimizations
* Refactored Student Dashboard to include meaningful learning stats and more interactive course cards.

---

## Checked Job
### 1. Work Done
* Restructured the frontend `src/app` directory for better organization, eliminating the nested `(pages)` and `(authorized)` groups.
* Created top-level route groups: `(home)`, `(auth)`, `dashboard/`, `adminpanel/`, and `checkout/`.
* Moved the study material section under the `dashboard/` group.
* Systematically fixed all TypeScript and attribute errors across the frontend by updating shared type definitions and correcting component logic.
* Updated all internal links and navigation menus to reflect the new directory structure.
* Verified that the frontend compiles without errors using `npx tsc --noEmit`.
### 2. Files Changed
* `frontend/src/app/**/*` (Major restructuring)
* `frontend/src/types/*.ts` (Complete type alignment)
* `frontend/src/components/course-card.tsx`
* `frontend/src/components/enroll-button.tsx`
* `frontend/src/components/header.tsx`
* `frontend/src/components/app-sidebar.tsx`
* `frontend/src/app/adminpanel/layout.tsx`
* `frontend/src/app/dashboard/layout.tsx`
### 3. Completion %
* 100%
### 4. Issues
* None. The app is now structurally sound and type-safe.
### 5. Optimizations
* Refactored `CourseCard` to be more polymorphic, handling both public and user-specific course data shapes.

---

## Checked Job
### 1. Work Done
* Synchronized all frontend API hooks in `frontend/src/hooks/api/` with the refactored backend response types.
* Updated Zod schemas to exactly match the JSON tags and data types (e.g., `int` vs `string` for IDs) defined in backend models.
* Corrected API endpoint URLs in several hooks to match the backend router configuration (e.g., study and user update routes).
* Ensured that all `apiRequest` calls are properly typed and validate the `data` field of the backend response.
### 2. Files Changed
* `frontend/src/hooks/api/dashboards-user.ts`
* `frontend/src/hooks/api/dashboards-admin.ts`
* `frontend/src/hooks/api/study-hooks.ts`
* `frontend/src/hooks/api/checkout-hooks.ts`
* `frontend/src/hooks/api/users-admin.ts`
* `frontend/src/hooks/api/users-user.ts`
* `frontend/src/hooks/api/courses-admin.ts`
* `frontend/src/hooks/api/courses-public.ts`
* `frontend/src/hooks/api/courses-user.ts`
* `frontend/src/hooks/api/coupons-admin.ts`
* `frontend/src/hooks/api/coupons-user.ts`
* `frontend/src/hooks/api/feedback-admin.ts`
* `frontend/src/hooks/api/feedback-user.ts`
* `frontend/src/hooks/api/transactions-admin.ts`
* `frontend/src/hooks/api/transactions-user.ts`
* `frontend/src/hooks/api/upload-hooks.ts`
### 3. Completion %
* 100%
### 4. Issues
* None. End-to-end type safety has been established.
### 5. Optimizations
* Centralizing common Zod schemas (like `MediaSchema`) into a shared file could reduce duplication across hook files.
---
## Output Format (MANDATORY)
### 1. Work Done
* Summary of implementation
### 2. Files Changed
* List of modified/created files
### 3. Completion %
* e.g. 85%
### 4. Issues
* Bugs / risks / limitations
### 5. Optimizations
* Possible improvements
---
## Rules
* Always update Current Job BEFORE coding
* Always move to Checked Job AFTER completion
* Never skip validation steps
