# CourseHunt Tutor Dashboard - Complete Page Specification

## Overview

| Property | Value |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 7 |
| **UI Component Library** | shadcn/ui (powered by @base-ui/react + @radix-ui primitives) |
| **Form Handling** | react-hook-form + zod (planned, currently using plain useState) |
| **Icons** | @tabler/icons-react (via `<Icon name="..." />` wrapper) |
| **Styling** | Tailwind CSS v4 (no config file, `@import "tailwindcss"` in globals.css) |
| **State Management** | Zustand v5 (session), TanStack React Query v5 (server state) |
| **Charts** | Recharts |
| **Validation** | Zod v4 (schemas in `package/schema/`) |
| **HTTP Client** | Axios (with Zod validation on responses) |
| **Authentication** | JWT (cookie-based), middleware proxy |
| **Toasts** | Sonner |
| **File Upload** | ImageKit CDN via `package/components/file-upload` |
| **Font** | Montserrat (next/font/google) |
| **Tutor Port** | 3001 |

---

## Layout Architecture

### Root Layout (`apps/tutor/src/app/layout.tsx`)
```
QueryProvider
└── SessionProvider
    └── ThemeProvider (next-themes, class-based)
        └── Toaster (sonner)
            └── {children}
```
- Global CSS imported: `@package/styles/globals.css`
- Montserrat font via CSS variable `--font-sans`
- `suppressHydrationWarning` on `<html>` for next-themes

### Auth Pages Layout (login, change-password)
- Full-screen centered layout
- No sidebar, no header
- Dark gradient background: `bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950`
- Decorative blobs: blue/purple tones (different from admin's green/teal)

### Dashboard Layout (`apps/tutor/src/app/(dashboard)/layout.tsx`)
```
SidebarProvider
├── AppSidebar (left, collapsible)
└── <main> (min-h-screen, w-full)
    ├── <header> (fixed top bar)
    │   ├── SidebarTrigger (hamburger toggle)
    │   └── BreadcrumbComponent (auto breadcrumb)
    └── <section class="p-8">
        └── {children} (page content)
```
- Identical layout structure to the admin dashboard
- Different sidebar navigation with tutor-specific routes

### Middleware (`apps/tutor/src/proxy.ts`)
- Protects all routes except `/api`, `/_next/static`, `/_next/image`, `/favicon.ico`
- Checks `access_token` cookie
- Validates JWT and verifies `tutor` or `admin` role
- Redirects to `/auth/login` if unauthenticated or unauthorized
- Redirects to `/` if already authenticated and on login page

---

## Color Schema

The tutor app uses the **same global CSS variables** as the admin app (shared via `@package/styles/globals.css`). See the admin-dashboard-spec.md for the complete CSS variable table.

The only difference is the auth page uses **blue/purple** decorative blobs (`bg-blue-500/10`, `bg-purple-500/10`) instead of green/teal.

---

## Shared Components & Patterns

The tutor app uses the **same shared components** from `package/components/` and `package/ui/` as the admin app:
- `<DataTable>`, `<Icon>`, `<Loading>`, `<LoadingButton>`, `<BreadcrumbComponent>`, `<ConfirmDeleteDialog>`, `<AppSidebar>`, `<FileUpload>`
- All shadcn/ui components: `Card`, `Button`, `Input`, `Label`, `Badge`, `Dialog`, `Select`, `Switch`, `Tabs`, `Textarea`, `Avatar`, `Accordion`, `Separator`, `Progress`, `Skeleton`, `Sonner`, `Tooltip`, `Sheet`, etc.

---

## Page-by-Page Breakdown

---

### 1. Login Page (`/auth/login`)

**Route:** `apps/tutor/src/app/auth/login/page.tsx`

**Description:** Full-screen tutor login with email/password and Google SSO button.

**Layout:**
- Full viewport: `min-h-screen w-full flex items-center justify-center`
- Centered card: `w-full max-w-md`
- Decorated background: dark gradient + 2 large animated blurred blobs (blue/purple)

**Component Breakdown:**
1. **Decorative background divs** (absolute, blurred, animated)
2. **Card** (`Card > CardHeader + CardContent`)
   - `CardHeader`: Title "Tutor Portal", subtitle "Sign in to manage your courses and students"
   - `CardContent`:
     - **Email form** (onSubmit)
       - Email Input (type="email", placeholder="tutor@example.com")
       - Password Input (type="password")
       - Submit Button "Sign in with Email"
     - **Divider** ("Or continue with")
     - **Google SSO Button** (IconBrandGoogle, spinner when loading, hover scale animation)
     - **Footer divider** ("Tutor Access Only")
     - **Footer** ("Contact administrator" link in blue)

**Styling:** Same auth glassmorphism style as admin but with blue accents instead of green.

**Data:**
- State: `email`, `password` (controlled inputs)
- Mutation: `useLoginWithEmailMutation()`, `useLoginWithGoogleMutation()`
- Redirect: `router.push("/")` on success

---

### 2. Change Password Page (`/auth/change-password`)

**Route:** `apps/tutor/src/app/auth/change-password/page.tsx`

**Description:** Forces password change on first login.

**Layout:** Same auth layout - full-screen centered card (dark glassmorphism).

**Component Breakdown:**
1. **Card**: Title "Change Password" + subtitle "You must change your password before continuing"
2. **Form**:
   - Current Password Input
   - New Password Input
   - Confirm Password Input
   - Submit Button "Change Password"

**Validation:** Passwords must match, min 8 characters.

**Data:**
- State: `currentPassword`, `newPassword`, `confirmPassword`
- Mutation: `useChangePasswordMutation()`
- Redirect: `router.push("/")` on success

---

### 3. Dashboard Home (`/`)

**Route:** `apps/tutor/src/app/(dashboard)/page.tsx`

**Description:** Tutor analytics overview with stat cards and course performance list.

**Layout:**
- `space-y-8 w-full`
- Header section with date display
- 4 stat cards: `grid gap-6 md:grid-cols-2 lg:grid-cols-4`
- 1-column section below: `grid gap-8 lg:grid-cols-2` (only left column used)

**Component Breakdown:**
1. **Page Header**:
   - Left: "Tutor Dashboard" (h2, text-3xl, tracking-tight) + subtitle
   - Right: Date badge (IconCalendar + formatted date, `bg-muted/50 px-3 py-1 rounded-full w-fit`)
2. **4 Stat Cards** (each with colored border and background):
   - Total Courses (IconBooks, `bg-primary/5 border-primary/20`): count + "X published, Y draft"
   - Total Students (IconUsers, `bg-green-500/5 border-green-500/20`): count + "Enrolled across courses"
   - Total Revenue (IconCurrencyRupee, `bg-blue-500/5 border-blue-500/20`): ₹ amount + "Lifetime earnings"
   - Rating (IconStar, `bg-amber-500/5 border-amber-500/20`): average + "Average rating"
3. **Course Performance Card**:
   - Header: "Course Performance"
   - List of course stats (title + student count), each with bottom border
   - Empty state: "No course data yet."
4. **Loading State**: Skeleton placeholders for header, 4 cards, and content area

**Styling:**
- Skeleton loading: `<Skeleton>` shadcn component
- Colored stat cards: `bg-{color}-500/5 border-{color}-500/20`
- Date badge: `bg-muted/50 px-3 py-1 rounded-full w-fit`
- Course list items: `flex items-center justify-between py-2 border-b last:border-0`

**Data:**
- Query: `useTutorDashboardQuery()` → `TutorDashboard`
- Types: `{ total_courses, published_courses, draft_courses, total_students, total_revenue, rating_avg, course_stats: TutorCourseStat[] }`
- `TutorCourseStat`: `{ course_id, title, students }`

---

### 4. Profile Page (`/profile`)

**Route:** `apps/tutor/src/app/(dashboard)/profile/page.tsx`

**Description:** Edit tutor profile with avatar upload and personal info.

**Layout:** Same structure as admin profile:
- `max-w-5xl mx-auto space-y-6`
- Two-column on md+: `flex flex-col md:flex-row gap-6`
  - Left: Avatar card (w-80)
  - Right: Edit form (flex-1)

**Component Breakdown:**
1. **Profile Card** (left column):
   - Gradient header (h-24, `from-primary to-primary/60`)
   - Avatar circle (24x24, clickable, upload overlay on hover)
   - Name + "Tutor" Badge
   - Hidden file input for upload
2. **Edit Profile Card** (right column):
   - Header: "Edit Tutor Profile" + subtitle
   - **Basic Information** section:
     - Display Name (Input)
     - Email Address (disabled, with IconMail)
     - Headline (Input, placeholder "e.g., Expert Web Developer")
     - Website (Input, placeholder "https://tutorportfolio.com")
     - Biography (Textarea, min-h-[120px])
   - **Action Buttons**:
     - "Update Profile" (green bg, loading button)
     - "Cancel" (outline button)

**Data:** Same pattern as admin profile but uses tutor-specific hooks:
- Session: `useSessionStore`
- Profile query: `useTutorProfileQuery()` → `{ headline, bio, website }`
- Mutations: `useUpdateUserMutation()`, `useCreateTutorProfileMutation()`, `useUploadMediaMutation()`

---

### 5. Courses Page (`/courses`)

**Route:** `apps/tutor/src/app/(dashboard)/courses/page.tsx`

**Description:** Tutor's course list with search, filter, CRUD operations, and action links.

**Layout:**
- `space-y-6`
- Toolbar with "New Course" button
- Single Card with DataTable

**Component Breakdown:**
1. **Page Header**: "My Courses" + subtitle
2. **CoursesToolbar** (separate component):
   - Search Input (IconSearch, flex-1, max-w-xs)
   - Status Select (All/Draft/Published/Archived)
   - Level Select (All/Beginner/Intermediate/Advanced)
   - "New Course" Button (IconPlus, opens create dialog)
3. **Card**:
   - Header: "All Courses"
   - `CardContent p-0`:
     - **CoursesTable** (DataTable + delete dialog) with 6 columns:
       - "Course": thumbnail (10x10) + title + lecture count
       - "Status": Badge (published=default, else secondary)
       - "Price": ₹ formatted
       - "Rating": star icon + number
       - "Students": user icon + count
       - "" (actions): Edit (opens CourseUpdateDialog) + Enrolled Students + Chapters + Delete
4. **CourseCreateDialog** (Dialog):
   - Title Input
   - Language Select (English/Hindi)
   - Level Select (Beginner/Intermediate/Advanced/All Levels)
   - Status Select (Draft/Published)
   - "Create Course" button
5. **CourseUpdateDialog** (Dialog, max-w-2xl):
   - 3 tabs: Basic Info, Media & Pricing, Settings
   - **Basic Info**: Title, Short Description, Long Description
   - **Media & Pricing**: Thumbnail URL, Preview Video URL, Actual Price, Final Price
   - **Settings**: Language, Level, Status
   - "Save Changes" button
6. **ConfirmDeleteDialog**: Delete course with warning about chapters/lessons/resources

**Styling:**
- Same course table styling as admin
- Update dialog: `Tabs` with 3 tab triggers in `grid grid-cols-3`
- Delete confirmation description includes all consequences

**Data:**
- Query: `useManageCoursesQuery({ page, limit, search, status, level })` → paginated `Course[]`
- Mutations: `useCreateCourseMutation()`, `useUpdateCourseMutation()`, `useDeleteCourseMutation()`
- Same `Course` type as admin

---

### 6. Course Edit Wizard (`/courses/edit/[id]`)

**Route:** `apps/tutor/src/app/(dashboard)/courses/edit/[id]/page.tsx`

**Description:** Multi-step wizard for editing all aspects of a course. 6 steps with Previous/Next navigation.

**Layout:**
- `space-y-6`
- Step navigation buttons (horizontal pills)
- Single Card with step content
- Prev/Next buttons at bottom

**Step Navigation:**
```
[Basic] [Details] [Chapters & Lessons] [FAQ] [Resources] [Settings]
```
- Current step highlighted with `variant="default"` and IconChevronRight
- Other steps: `variant="outline"`
- Clickable to jump to any step

**Component Breakdown:**

**Step 0: BasicStep (`basic-step.tsx`)**
- Course Title (Input)
- Category Select (from categories query)
- Language Select (English/Hindi)
- Short Description (Textarea, 3 rows)
- Level Select (Beginner/Intermediate/Advanced)
- Course Image: URL Input + FileUpload component
- "Save Changes" Button

**Step 1: DetailsStep (`details-step.tsx`)**
- Long Description (Textarea, 6 rows)
- "What You Will Learn" (dynamic list of Inputs with add/remove)
- "Requirements" (dynamic list of Inputs with add/remove)
- "Save Changes" Button

**Step 2: ChapterLessonStep (`chapter-lesson-step.tsx`)**
- Accordion-based chapter list
- Each chapter: Input for title + lesson count badge + delete button
- Expanded: lesson list with title Input + type Select (Video/Reading) + remove button
- "Add Lesson" button per chapter
- "Add Chapter" button at bottom

**Step 3: FaqStep (`faq-step.tsx`)**
- Dynamic FAQ list
- Each FAQ: Question Input + Answer Textarea in bordered card
- Delete button per FAQ
- "Add FAQ" button

**Step 4: ResourcesStep (`resources-step.tsx`)**
- Dynamic course-level resources list
- Each resource: Title Input + FileUpload for document
- Delete button per resource
- "Add Resource" button

**Step 5: SettingsStep (`settings-step.tsx`)**
- Card with Published toggle Switch
- Description text (live/draft status)
- "Publish Course" / "Unpublish Course" Button

**Styling:**
- Step nav pills: `flex gap-2 flex-wrap`
- Dynamic list items: `flex gap-2` with Input + remove button
- Empty states via accordion
- Resources/FAQs: `p-4 rounded-lg border`

**Data:**
- Query: `useCourseLandingQuery(courseId)` → course data
- Query: `useCategoriesQuery()` → category list
- Mutation: `useUpdateCourseMutation()`
- All step data managed via local state - **no persistence until "Save Changes" clicked**

---

### 7. Course Chapters (`/courses/[courseId]/chapters`)

**Route:** `apps/tutor/src/app/(dashboard)/courses/[courseId]/chapters/page.tsx`

**Description:** Full CRUD for chapters and lessons within a course.

**Layout:**
- `space-y-6`
- Header with "Add Chapter" button
- Vertical list of expandable chapter cards
- Multiple dialog components

**Component Breakdown:**
1. **Page Header**: "Back to Courses" link + "Course Structure" title + "Add Chapter" button
2. **Chapter Cards** (ChapterCard component, vertical `space-y-4`):
   - Chapter number circle (primary/10 bg)
   - Title + lesson count
   - Action buttons: Edit (pencil), Delete (trash), Show/Hide Lessons toggle
   - Expanded: shows LessonsTable
3. **LessonsTable** (within each chapter):
   - "Add Lesson" button at top
   - Lesson rows: number badge + title + type badge (video=blue, document=green) + short description
   - Action buttons per lesson:
     - Edit Content (links to `/courses/{courseId}/lessons/{lessonId}`)
     - Settings (opens LessonUpdateDialog)
     - Delete (opens ConfirmDeleteDialog)
   - Empty state: dashed border
4. **ChapterCreateDialog**: Chapter Number (disabled) + Title Input + "Create Chapter" button
5. **ChapterUpdateDialog**: Chapter Number (disabled) + Title Input + "Save Changes"
6. **LessonCreateDialog** (2-step):
   - Step 1: Type selection cards (Video/Document/Quiz with icons and descriptions)
   - Step 2: Title, Short Description, Preview Video URL (video only), Duration (seconds)
   - Back/Continue/Create navigation
7. **LessonUpdateDialog**: Lesson Type badge + Lesson Number (disabled) + Title + Description + Preview URL (video only) + Duration
8. **ConfirmDeleteDialog** for both chapters and lessons

**Styling:**
- Chapter number: `w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary`
- Lesson rows: `rounded-lg bg-background border hover:border-primary/50 transition-colors`
- Lesson type badges: `text-[10px] uppercase font-bold px-1.5 py-0.5 rounded`
- LessonCreateDialog type cards: `rounded-xl border-2 transition-all`, selected: `border-primary bg-primary/5`, unselected: `border-transparent bg-muted`
- Empty state: `border-2 border-dashed rounded-xl`

**Data:**
- Query: `useChaptersQuery(courseId)` → `Chapter[]`
- Query: `useLessonsQuery(chapterId)` → `Lesson[]`
- Mutations: `useCreateChapterMutation()`, `useUpdateChapterMutation()`, `useDeleteChapterMutation()`
- Mutations: `useCreateLessonMutation()`, `useUpdateLessonMutation()`, `useDeleteLessonMutation()`
- Types: `Chapter{ id, chapter_no, title, total_lectures }`, `Lesson{ id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds }`

---

### 8. Lesson Editor (`/courses/[courseId]/lessons/[lessonId]`)

**Route:** `apps/tutor/src/app/(dashboard)/courses/[courseId]/lessons/[lessonId]/page.tsx`

**Description:** Full lesson content editing - video/document/quiz content + downloadable resources.

**Layout:**
- `space-y-6 max-w-4xl pb-12` (narrower content width)
- Back link to chapters
- Content editors rendered based on lesson type
- Resources panel at bottom

**Component Breakdown:**
1. **Page Header**: "Back to Chapters" link + "Lesson Editor" title with type Badge
2. **Conditional Content Editor** (based on `lesson_type`):
   - **Video Lesson** → `VideoContentEditor`
   - **Document Lesson** → `DocumentContentEditor`
   - **Quiz Lesson** → `QuizContentEditor`
3. **ResourcesPanel** (bottom, separated by border-t):
   - Header: "Downloadable Resources" + "Add Resource" button
   - Resource list: Icon (file type based) + title + file type badge
   - Actions per resource: Download link + Delete button
   - Empty state: "No resources added."
   - **Add Resource Dialog**: Title Input + File URL Input + File Type Select (PDF/Video/Document/Image/Other) + "Add Resource" button

**VideoContentEditor:**
- Card with "Video Content" title
- Video URL Input
- Written Content Textarea (min-h-[200px], optional)
- "Save Video" Button

**DocumentContentEditor:**
- Card with "Document Content" title
- Content Textarea (min-h-[400px], font-mono, "Markdown supported")
- "Save Document" Button

**QuizContentEditor:**
- **Quiz Settings Card**: Title Input + Time Limit (seconds) + Passing Score (%) + "Create/Update Quiz" button
- **Questions Card** (only if quiz exists):
  - Header: "Questions (N)" + "Add Question" button
  - Question list with question text, type badge, points, delete button
  - Empty state: "No questions added yet."
  - **Add Question Dialog**:
    - Question Input
    - Dynamic option list (min 2) with radio button for correct answer
    - "Add Option" / remove buttons
    - "Save Question" button
- **ConfirmDeleteDialog** for questions

**Styling:**
- Lesson editor: `max-w-4xl` constrained width
- Document editor textarea: `min-h-[400px] font-mono text-sm`
- Resource items: `p-3 rounded-lg bg-muted/30 border`
- Quiz questions: `p-4 rounded-lg bg-muted/30 border`

**Data:**
- Query: `useLessonContentQuery(lessonId)` → `AggregatedLessonContentResponse` (contains video_content, document_content, quiz_content, lesson_type)
- Query: `useLessonResourcesQuery(lessonId)` → resources list
- Mutations: `useAddVideoMutation()`, `useAddDocumentMutation()`, `useAddResourceMutation()`, `useDeleteResourceMutation()`
- Mutations: `useCreateQuizMutation()`, `useCreateQuestionMutation()`, `useDeleteQuestionMutation()`
- Types: `QuizMetadata{ id, title, time_limit_seconds, pass_score_percent, total_questions }`, `QuizQuestion{ id, question_text, question_type, points }`

---

### 9. Enrolled Students (`/enrolled-students/[course_id]`)

**Route:** `apps/tutor/src/app/(dashboard)/enrolled-students/[course_id]/page.tsx`

**Description:** View students enrolled in a specific course with progress tracking.

**Layout:**
- `space-y-6`
- Single Card with DataTable (10 per page, server-side paginated)

**Component Breakdown:**
1. **Page Header**: "Enrolled Students" + subtitle
2. **Card**:
   - Header: "Students"
   - `CardContent p-0`:
     - **DataTable** with 4 columns:
       - "Student": Avatar + name + user ID (muted)
       - "Progress": progress bar (w-24, h-2, rounded-full) + percentage
       - "Status": Badge (Completed=green, Revoked=destructive, Active=secondary)
       - "Enrolled At": localized date, right-aligned

**Styling:**
- Progress bar: `w-24 h-2 bg-muted rounded-full overflow-hidden` with `h-full bg-primary rounded-full transition-all` inner div
- Student ID: `text-xs text-muted-foreground`

**Data:**
- Query: `useEnrollmentsQuery(courseId)` → paginated `ListEnrollmentResponse[]`
- Types: `ListEnrollmentResponse{ id, user: { id, name, image }, completion_percent, completed, revoked, enrolled_at }`
- **Note**: The sidebar links to `/enrolled-students` but no index page exists at that route.

---

### 10. Feedbacks Page (`/feedbacks`)

**Route:** `apps/tutor/src/app/(dashboard)/feedbacks/page.tsx`

**Description:** View and manage student feedback/reviews on tutor's courses.

**Layout:**
- `space-y-6`
- Header with title
- Single Card with DataTable (10 per page)

**Component Breakdown:**
1. **Page Header**: "Course Feedbacks" + subtitle
2. **Card**:
   - Header: "All Feedbacks"
   - `CardContent p-0`:
     - **DataTable** with 7 columns:
       - "Course": title or "Unknown"
       - "Student": avatar + name (or "Anonymous")
       - "Rating": 5 star icons (amber filled based on rating)
       - "Comment": line-clamp-2, max-w-62.5
       - "Status": Badge (Pinned=blue, Normal=outline)
       - "Date": localized, right-aligned
       - "Actions": Pin toggle (star icon) + Delete (trash, uses `confirm()` dialog)

**Data:**
- Query: `useFeedbacksQuery()` → paginated `Feedback[]`
- Types: Same as admin `Feedback{ id, user: { id, name, image }, course: { title }, rating, content, is_pinned, created_at }`
- Mutations: `useUpdateFeedbackMutation()` (pin toggle), `useDeleteFeedbackMutation()`

---

### 11. Discussions Page (`/discussions/[lesson_id]`)

**Route:** `apps/tutor/src/app/(dashboard)/discussions/[lesson_id]/page.tsx`

**Description:** View, reply to, edit, and delete lesson discussions.

**Layout:**
- `space-y-6`
- Single Card with DataTable (10 per page)

**Component Breakdown:**
1. **Page Header**: "Course Discussions" + subtitle
2. **Card**:
   - Header: "All Discussions"
   - `CardContent p-0`:
     - **DataTable** with 6 columns:
       - "Student": avatar + name (or "Anonymous")
       - "Lesson": truncated lesson ID
       - "Message": line-clamp-2, max-w-75
       - "Replies": count
       - "Date": localized
       - "" (actions): Reply + Edit (own only) + Delete
3. **Reply Dialog**: Shows original message in muted card, then Textarea + "Post Reply" button
4. **Edit Dialog**: Textarea pre-filled with content + "Save" button
5. Delete uses `confirm()` browser dialog

**Data:**
- Query: `useDiscussionsQuery(lessonId, page, limit)` → paginated `Discussion[]`
- Types: `Discussion{ id, content, lesson_id, parent_id, reply_count, user: { id, name, image }, created_at }`
- Mutations: `useCreateDiscussionMutation()` (replies), `useUpdateDiscussionMutation()`, `useDeleteDiscussionMutation()`
- Session: `useSessionStore` to identify own discussions for edit permission

---

## Sidebar Navigation

Defined in `apps/tutor/src/components/app-sidebar.tsx`:

```
Tutor Panel
├── Dashboard (/)
├── Courses (/courses)
├── Feedbacks (/feedbacks)
├── Discussions (/discussions)      ← Note: no index page, only [lesson_id] exists
├── Enrolled Students (/enrolled-students)  ← Note: no index page, only [course_id] exists
└── Profile (/profile)
```

**Issue**: The sidebar contains links to `/discussions` and `/enrolled-students` which are not actual routes (only parameterized routes exist). These will result in 404 errors.

---

## Global Grid / Layout Patterns

| Pattern | Classes | Used On |
|---|---|---|
| 4-color stat grid | `grid gap-6 md:grid-cols-2 lg:grid-cols-4` | Dashboard |
| Single card with DataTable | `Card > CardContent p-0` | Courses, Feedbacks, Discussions, Enrolled Students |
| Page wrapper | `space-y-6` | All pages |
| Centered form | `max-w-md mx-auto` | Auth pages |
| Profile layout | `flex flex-col md:flex-row gap-6` | Profile |
| Wizard card | `Card > CardContent p-6` | Course Edit Wizard |
| Lesson editor | `space-y-6 max-w-4xl pb-12` | Lesson Editor |
| Page title | `text-2xl font-bold` | All pages |
| Page subtitle | `text-muted-foreground text-sm` | All pages |

---

## Current Technical Debt & Issues

1. **No form validation library**: All forms use plain `useState` and manual validation. Should migrate to `react-hook-form` + `zod`.
2. **Broken sidebar links**: `/discussions` and `/enrolled-students` in the sidebar point to non-existent index pages (only paramaterized sub-routes exist).
3. **`confirm()` used instead of custom dialog**: Discussions page uses browser `confirm()` for delete; Feedbacks also uses `confirm()`. Should use `ConfirmDeleteDialog`.
4. **Course edit wizard steps don't persist to API**: Changes in each step are saved individually via "Save Changes" buttons rather than a single submission, causing partial saves and poor UX.
5. **No optimistic updates**: Mutations don't optimistically update the cache.
6. **`any` types used**: Several places use `any` type assertions instead of proper types (course edit, chapter-lesson step).
7. **No real-time data**: Dashboard stats don't update without page refresh.
8. **No loading skeletons on chapters page**: Uses simple text "Loading chapters..." instead of proper skeleton.
9. **LessonCreateDialog uses local step state**: Could be simplified with a form library.
10. **Quiz questions don't show options**: Only the question text is displayed in the list; options/correct answer not visible.
11. **No proper pagination on some pages**: Feedbacks and Discussions have server-side pagination but the implementation varies.
12. **FileUpload component usage**: Some places use bare URL inputs instead of FileUpload for course images, resources.
