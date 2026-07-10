# CourseHunt Backend API Documentation

This document contains all the API endpoints in the backend along with their request body and response types.

## GET /api/v1/cart

**Summary**: ListController

**Description**: ListController for Cart

### Response
**Status 200**

```markdown
- **data** (`array of objects`)
  - **added_at** (`string`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **id** (`string`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/cart

**Summary**: ClearController

**Description**: ClearController for Cart

### Response
**Status 200**

```markdown
- **data** (`null`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/cart/course/{courseID}

**Summary**: AddController

**Description**: AddController for Cart

### Path Parameters
- **courseID** (`string`): courseID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **added_at** (`string`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **id** (`string`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/cart/course/{courseID}

**Summary**: RemoveController

**Description**: RemoveController for Cart

### Path Parameters
- **courseID** (`string`): courseID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/categories

**Summary**: ListController

**Description**: ListController for Category

### Response
**Status 200**

```markdown
- **data** (`array of objects`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **name** (`string`)
  - **parent_id** (`string`)
  - **subcategories** (`array of objects`)
    - **created_at** (`string`)
    - **id** (`string`)
    - **name** (`string`)
    - **parent_id** (`string`)
    - **subcategories** (`array of objects`)
      - **(Recursion limit reached for category.Category)**
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/categories

**Summary**: CreateController

**Description**: CreateController for Category

### Request Body
```markdown
- **name** (`string`)
- **parent_id** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **name** (`string`)
  - **parent_id** (`string`)
  - **subcategories** (`array of objects`)
    - **created_at** (`string`)
    - **id** (`string`)
    - **name** (`string`)
    - **parent_id** (`string`)
    - **subcategories** (`array of objects`)
      - **(Recursion limit reached for category.Category)**
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/categories/{id}

**Summary**: DeleteController

**Description**: DeleteController for Category

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/categories/{id}

**Summary**: UpdateController

**Description**: UpdateController for Category

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **name** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **name** (`string`)
  - **parent_id** (`string`)
  - **subcategories** (`array of objects`)
    - **created_at** (`string`)
    - **id** (`string`)
    - **name** (`string`)
    - **parent_id** (`string`)
    - **subcategories** (`array of objects`)
      - **(Recursion limit reached for category.Category)**
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/certificates

**Summary**: ListController

**Description**: ListController for Certificate

### Response
**Status 200**

```markdown
- **data** (`array of objects`)
  - **course_id** (`string`)
  - **course_title** (`string`)
  - **id** (`string`)
  - **issued_at** (`string`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/certificates/claim/course/{courseID}

**Summary**: ClaimController

**Description**: ClaimController for Certificate

### Path Parameters
- **courseID** (`string`): courseID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **id** (`string`)
  - **issued_at** (`string`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/certificates/course/{courseID}

**Summary**: GetController

**Description**: GetController for Certificate

### Path Parameters
- **courseID** (`string`): courseID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **id** (`string`)
  - **issued_at** (`string`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/chapters/course/{courseID}

**Summary**: ListController

**Description**: ListController for Chapters

### Path Parameters
- **courseID** (`string`): courseID

### Response
**Status 200**

```markdown
- **data** (`array of objects`)
  - **chapter_no** (`integer`)
  - **course_id** (`string`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **title** (`string`)
  - **total_duration_seconds** (`integer`)
  - **total_lectures** (`integer`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/chapters/course/{courseID}

**Summary**: CreateController

**Description**: CreateController for Chapters

### Path Parameters
- **courseID** (`string`): courseID

### Request Body
```markdown
- **chapter_no** (`integer`)
- **title** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **chapter_no** (`integer`)
  - **course_id** (`string`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **title** (`string`)
  - **total_duration_seconds** (`integer`)
  - **total_lectures** (`integer`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/chapters/{id}

**Summary**: DeleteController

**Description**: DeleteController for Chapters

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/chapters/{id}

**Summary**: UpdateController

**Description**: UpdateController for Chapters

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **chapter_no** (`integer`)
- **title** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **chapter_no** (`integer`)
  - **course_id** (`string`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **title** (`string`)
  - **total_duration_seconds** (`integer`)
  - **total_lectures** (`integer`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/coupons

**Summary**: ListController

**Description**: ListController for Coupons

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **code** (`string`)
    - **course** (`object`)
      - **id** (`string`)
      - **thumbnail** (`string`)
      - **title** (`string`)
    - **created_at** (`string`)
    - **created_by** (`string`)
    - **discount_percent** (`number`)
    - **expires_at** (`string`)
    - **id** (`string`)
    - **is_active** (`boolean`)
    - **max_usage** (`integer`)
    - **usage_count** (`integer`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/coupons

**Summary**: CreateController

**Description**: CreateController for Coupons

### Request Body
```markdown
- **code** (`string`)
- **course_id** (`string`)
- **discount_percent** (`number`)
- **expires_at** (`string`)
- **is_active** (`boolean`)
- **max_usage** (`integer`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **code** (`string`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **created_at** (`string`)
  - **created_by** (`string`)
  - **discount_percent** (`number`)
  - **expires_at** (`string`)
  - **id** (`string`)
  - **is_active** (`boolean`)
  - **max_usage** (`integer`)
  - **usage_count** (`integer`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/coupons/check

**Summary**: CheckController

**Description**: CheckController for Coupons

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **discount_percent** (`number`)
  - **reason** (`string`)
  - **valid** (`boolean`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/coupons/{id}

**Summary**: DeleteController

**Description**: DeleteController for Coupons

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/coupons/{id}

**Summary**: UpdateController

**Description**: UpdateController for Coupons

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **discount_percent** (`number`)
- **expires_at** (`string`)
- **is_active** (`boolean`)
- **max_usage** (`integer`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **code** (`string`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **created_at** (`string`)
  - **created_by** (`string`)
  - **discount_percent** (`number`)
  - **expires_at** (`string`)
  - **id** (`string`)
  - **is_active** (`boolean`)
  - **max_usage** (`integer`)
  - **usage_count** (`integer`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/courses

**Summary**: ListController

**Description**: ListController for Courses

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **actual_price** (`number`)
    - **benefits** (`array of string`)
    - **feedback_count** (`integer`)
    - **final_price** (`number`)
    - **id** (`string`)
    - **image_url** (`string`)
    - **instructor** (`object`)
      - **headline** (`string`)
      - **id** (`string`)
      - **image** (`string`)
      - **name** (`string`)
    - **level** (`string`)
    - **rating_avg** (`number`)
    - **short_description** (`string`)
    - **slug** (`string`)
    - **title** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/courses

**Summary**: CreateController

**Description**: CreateController for Courses

### Request Body
```markdown
- **category_id** (`string`)
- **language** (`string`)
- **level** (`string`)
- **short_description** (`string`)
- **status** (`string`)
- **subcategory_id** (`string`)
- **title** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **slug** (`string`)
  - **status** (`string`)
  - **title** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/courses/{id}

**Summary**: DeleteController

**Description**: DeleteController for Courses

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/courses/{id}

**Summary**: UpdateController

**Description**: UpdateController for Courses

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **actual_price** (`number`)
- **benefits** (`array of string`)
- **category_id** (`string`)
- **coupon_allowed** (`boolean`)
- **final_price** (`number`)
- **image_url** (`string`)
- **language** (`string`)
- **level** (`string`)
- **long_description** (`string`)
- **preview_video_url** (`string`)
- **requirements** (`array of string`)
- **short_description** (`string`)
- **status** (`string`)
- **subcategory_id** (`string`)
- **title** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **actual_price** (`number`)
  - **benefits** (`array of string`)
  - **coupon_allowed** (`boolean`)
  - **created_at** (`string`)
  - **feedback_count** (`integer`)
  - **final_price** (`number`)
  - **id** (`string`)
  - **language** (`string`)
  - **level** (`string`)
  - **rating_avg** (`number`)
  - **requirements** (`array of string`)
  - **slug** (`string`)
  - **status** (`string`)
  - **title** (`string`)
  - **total_duration_seconds** (`integer`)
  - **total_lectures** (`integer`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/courses/{id}/study

**Summary**: ReadStudyController

**Description**: ReadStudyController for Courses

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **chapters** (`array of objects`)
    - **chapter_no** (`integer`)
    - **id** (`string`)
    - **lessons** (`array of objects`)
      - **completed** (`boolean`)
      - **duration_seconds** (`integer`)
      - **id** (`string`)
      - **lesson_no** (`integer`)
      - **lesson_type** (`string`)
      - **title** (`string`)
    - **progress** (`object`)
      - **completed** (`boolean`)
      - **lessons_completed** (`integer`)
    - **title** (`string`)
    - **total_duration_seconds** (`integer`)
    - **total_lectures** (`integer`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **enrollment** (`object`)
    - **completed** (`boolean`)
    - **completion_percent** (`number`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/courses/{slug}

**Summary**: ReadLandingController

**Description**: ReadLandingController for Courses

### Path Parameters
- **slug** (`string`): slug

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **actual_price** (`number`)
  - **benefits** (`array of string`)
  - **category** (`object`)
    - **id** (`string`)
    - **name** (`string`)
  - **chapters** (`array of objects`)
    - **chapter_no** (`integer`)
    - **id** (`string`)
    - **lessons** (`array of objects`)
      - **duration_seconds** (`integer`)
      - **id** (`string`)
      - **lesson_no** (`integer`)
      - **lesson_type** (`string`)
      - **preview_video_url** (`string`)
      - **short_description** (`string`)
      - **title** (`string`)
    - **title** (`string`)
    - **total_duration_seconds** (`integer`)
    - **total_lectures** (`integer`)
  - **feedback_count** (`integer`)
  - **final_price** (`number`)
  - **id** (`string`)
  - **image_url** (`string`)
  - **instructor** (`object`)
    - **headline** (`string`)
    - **id** (`string`)
    - **image** (`string`)
    - **name** (`string`)
  - **is_enrolled** (`boolean`)
  - **language** (`string`)
  - **level** (`string`)
  - **long_description** (`string`)
  - **preview_video_url** (`string`)
  - **rating_avg** (`number`)
  - **requirements** (`array of string`)
  - **short_description** (`string`)
  - **slug** (`string`)
  - **subcategory** (`object`)
    - **id** (`string`)
    - **name** (`string`)
  - **title** (`string`)
  - **total_duration_seconds** (`integer`)
  - **total_lectures** (`integer`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/dashboard/admin

**Summary**: AdminDashboardController

**Description**: AdminDashboardController for Dashboard

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **recent_transactions** (`array of objects`)
    - **amount** (`number`)
    - **course_id** (`string`)
    - **created_at** (`string`)
    - **id** (`string`)
    - **status** (`string`)
    - **user_id** (`string`)
  - **revenue_this_month** (`number`)
  - **top_courses** (`array of objects`)
    - **revenue** (`number`)
    - **students** (`integer`)
    - **title** (`string`)
  - **total_courses** (`integer`)
  - **total_enrollments** (`integer`)
  - **total_revenue** (`number`)
  - **total_tutors** (`integer`)
  - **total_users** (`integer`)
  - **user_growth** (`array of objects`)
    - **count** (`integer`)
    - **month** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/dashboard/tutor

**Summary**: TutorDashboardController

**Description**: TutorDashboardController for Dashboard

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **course_stats** (`array of objects`)
    - **course_id** (`string`)
    - **revenue** (`number`)
    - **students** (`integer`)
    - **title** (`string`)
  - **draft_courses** (`integer`)
  - **published_courses** (`integer`)
  - **rating_avg** (`number`)
  - **recent_transactions** (`array of objects`)
    - **amount** (`number`)
    - **course_title** (`string`)
    - **date** (`string`)
    - **user_name** (`string`)
  - **total_courses** (`integer`)
  - **total_revenue** (`number`)
  - **total_students** (`integer`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/dashboard/user

**Summary**: UserDashboardController

**Description**: UserDashboardController for Dashboard

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **certificates_count** (`integer`)
  - **completed_courses_count** (`integer`)
  - **enrolled_courses_count** (`integer`)
  - **in_progress_courses_count** (`integer`)
  - **recent_certificates** (`array of objects`)
    - **course_title** (`string`)
    - **issued_at** (`string`)
  - **recent_courses** (`array of objects`)
    - **completion_percent** (`number`)
    - **id** (`string`)
    - **image_url** (`string`)
    - **slug** (`string`)
    - **title** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/discussions/lesson/{lessonID}

**Summary**: ListController

**Description**: ListController for Discussions

### Path Parameters
- **lessonID** (`string`): lessonID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **content** (`string`)
    - **created_at** (`string`)
    - **depth** (`integer`)
    - **id** (`string`)
    - **reply_count** (`integer`)
    - **user** (`object`)
      - **id** (`string`)
      - **image** (`string`)
      - **name** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/discussions/lesson/{lessonID}

**Summary**: CreateController

**Description**: CreateController for Discussions

### Path Parameters
- **lessonID** (`string`): lessonID

### Request Body
```markdown
- **content** (`string`)
- **parent_id** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **content** (`string`)
  - **course_id** (`string`)
  - **created_at** (`string`)
  - **depth** (`integer`)
  - **id** (`string`)
  - **lesson_id** (`string`)
  - **parent_id** (`string`)
  - **reply_count** (`integer`)
  - **updated_at** (`string`)
  - **user** (`object`)
    - **id** (`string`)
    - **image** (`string`)
    - **name** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/discussions/replies/{id}

**Summary**: ListRepliesController

**Description**: ListRepliesController for Discussions

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **content** (`string`)
    - **created_at** (`string`)
    - **depth** (`integer`)
    - **id** (`string`)
    - **reply_count** (`integer`)
    - **user** (`object`)
      - **id** (`string`)
      - **image** (`string`)
      - **name** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/discussions/{id}

**Summary**: DeleteController

**Description**: DeleteController for Discussions

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/discussions/{id}

**Summary**: UpdateController

**Description**: UpdateController for Discussions

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **content** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **content** (`string`)
  - **course_id** (`string`)
  - **created_at** (`string`)
  - **depth** (`integer`)
  - **id** (`string`)
  - **lesson_id** (`string`)
  - **parent_id** (`string`)
  - **reply_count** (`integer`)
  - **updated_at** (`string`)
  - **user** (`object`)
    - **id** (`string`)
    - **image** (`string`)
    - **name** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/enrollments

**Summary**: ListController

**Description**: ListController for Enrollments

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **completed** (`boolean`)
    - **completion_percent** (`number`)
    - **course_id** (`string`)
    - **enrolled_at** (`string`)
    - **id** (`string`)
    - **last_accessed_lesson_id** (`string`)
    - **revoked** (`boolean`)
    - **user_id** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/enrollments/manual/course/{courseID}

**Summary**: CreateController

**Description**: CreateController for Enrollments

### Path Parameters
- **courseID** (`string`): courseID

### Request Body
```markdown
- **user_id** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **completed** (`boolean`)
  - **completion_percent** (`number`)
  - **course_id** (`string`)
  - **enrolled_at** (`string`)
  - **id** (`string`)
  - **last_accessed_lesson_id** (`string`)
  - **revoked** (`boolean`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/feedbacks

**Summary**: ListController

**Description**: ListController for Feedbacks

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **content** (`string`)
    - **course_id** (`string`)
    - **created_at** (`string`)
    - **id** (`string`)
    - **is_pinned** (`boolean`)
    - **rating** (`integer`)
    - **user** (`object`)
      - **id** (`string`)
      - **image** (`string`)
      - **name** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/feedbacks/course/{courseID}

**Summary**: CreateController

**Description**: CreateController for Feedbacks

### Path Parameters
- **courseID** (`string`): courseID

### Request Body
```markdown
- **content** (`string`)
- **rating** (`integer`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **content** (`string`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **is_pinned** (`boolean`)
  - **rating** (`integer`)
  - **user** (`object`)
    - **id** (`string`)
    - **image** (`string`)
    - **name** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/feedbacks/{id}

**Summary**: DeleteController

**Description**: DeleteController for Feedbacks

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/feedbacks/{id}/pin

**Summary**: UpdateController

**Description**: UpdateController for Feedbacks

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **content** (`string`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **created_at** (`string`)
  - **id** (`string`)
  - **is_pinned** (`boolean`)
  - **rating** (`integer`)
  - **user** (`object`)
    - **id** (`string`)
    - **image** (`string`)
    - **name** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/lessons/chapter/{chapterID}

**Summary**: ListController

**Description**: ListController for Lessons

### Path Parameters
- **chapterID** (`string`): chapterID

### Response
**Status 200**

```markdown
- **data** (`array of objects`)
  - **chapter_id** (`string`)
  - **created_at** (`string`)
  - **duration_seconds** (`integer`)
  - **id** (`string`)
  - **lesson_no** (`integer`)
  - **lesson_type** (`string`)
  - **title** (`string`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/lessons/chapter/{chapterID}

**Summary**: CreateController

**Description**: CreateController for Lessons

### Path Parameters
- **chapterID** (`string`): chapterID

### Request Body
```markdown
- **duration_seconds** (`integer`)
- **lesson_no** (`integer`)
- **lesson_type** (`string`)
- **preview_video_url** (`string`)
- **short_description** (`string`)
- **title** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **chapter_id** (`string`)
  - **created_at** (`string`)
  - **duration_seconds** (`integer`)
  - **id** (`string`)
  - **lesson_no** (`integer`)
  - **lesson_type** (`string`)
  - **title** (`string`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/lessons/resources/{resourceID}

**Summary**: DeleteResourceController

**Description**: DeleteResourceController for Lessons

### Path Parameters
- **resourceID** (`string`): resourceID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/lessons/{id}

**Summary**: DeleteController

**Description**: DeleteController for Lessons

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/lessons/{id}

**Summary**: UpdateController

**Description**: UpdateController for Lessons

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **duration_seconds** (`integer`)
- **lesson_no** (`integer`)
- **preview_video_url** (`string`)
- **short_description** (`string`)
- **title** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **chapter_id** (`string`)
  - **created_at** (`string`)
  - **duration_seconds** (`integer`)
  - **id** (`string`)
  - **lesson_no** (`integer`)
  - **lesson_type** (`string`)
  - **title** (`string`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/lessons/{id}/complete

**Summary**: UpdateCompleteController

**Description**: UpdateCompleteController for Lessons

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **completed** (`boolean`)
  - **lesson_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/lessons/{id}/content

**Summary**: ReadContentController

**Description**: ReadContentController for Lessons

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **completed** (`boolean`)
  - **content** (`object`)
    - **content** (`string`) - document
    - **quiz_metadata** (`any`) - quiz
    - **video_url** (`string`) - video
    - **written_content** (`string`)
  - **lesson** (`object`)
    - **chapter_id** (`string`)
    - **id** (`string`)
    - **lesson_no** (`integer`)
    - **lesson_type** (`string`)
    - **title** (`string`)
  - **resources** (`array of objects`)
    - **file_type** (`string`)
    - **file_url** (`string`)
    - **id** (`string`)
    - **lesson_id** (`string`)
    - **title** (`string`)
  - **user_note** (`object`)
    - **content** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/lessons/{id}/document

**Summary**: UpsertDocumentContentController

**Description**: UpsertDocumentContentController for Lessons

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **content** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **content** (`string`)
  - **id** (`string`)
  - **lesson_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/lessons/{id}/resources

**Summary**: CreateResourceController

**Description**: CreateResourceController for Lessons

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **file_type** (`string`)
- **file_url** (`string`)
- **title** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **file_type** (`string`)
  - **file_url** (`string`)
  - **id** (`string`)
  - **lesson_id** (`string`)
  - **title** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/lessons/{id}/signed-url

**Summary**: GetSignedURLController

**Description**: GetSignedURLController for Lessons

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **url** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/lessons/{id}/video

**Summary**: UpsertVideoContentController

**Description**: UpsertVideoContentController for Lessons

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **video_url** (`string`)
- **written_content** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
  - **lesson_id** (`string`)
  - **video_url** (`string`)
  - **written_content** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/me

**Summary**: MeController

**Description**: MeController for Users

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **banned** (`boolean`)
  - **createdAt** (`string`)
  - **email** (`string`)
  - **emailVerified** (`boolean`)
  - **id** (`string`)
  - **image** (`string`)
  - **name** (`string`)
  - **updatedAt** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/me/enrolled

**Summary**: EnrolledController

**Description**: EnrolledController for Courses

### Response
**Status 200**

```markdown
- **data** (`array of objects`)
  - **completion_percent** (`number`)
  - **id** (`string`)
  - **image_url** (`string`)
  - **instructor** (`object`)
    - **headline** (`string`)
    - **id** (`string`)
    - **image** (`string`)
    - **name** (`string`)
  - **last_accessed_lesson_id** (`string`)
  - **slug** (`string`)
  - **title** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/notes/lesson/{lessonID}

**Summary**: ReadController

**Description**: ReadController for Notes

### Path Parameters
- **lessonID** (`string`): lessonID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **content** (`string`)
  - **course_id** (`string`)
  - **id** (`string`)
  - **lesson_id** (`string`)
  - **updated_at** (`string`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/notes/lesson/{lessonID}

**Summary**: UpsertController

**Description**: UpsertController for Notes

### Path Parameters
- **lessonID** (`string`): lessonID

### Request Body
```markdown
- **content** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **content** (`string`)
  - **id** (`string`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/notes/{id}

**Summary**: DeleteController

**Description**: DeleteController for Notes

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/notes/{id}

**Summary**: UpdateController

**Description**: UpdateController for Notes

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **content** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **content** (`string`)
  - **id** (`string`)
  - **updated_at** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/profile/tutor

**Summary**: UpsertTutorProfileController

**Description**: UpsertTutorProfileController for Profile

### Request Body
```markdown
- **bio** (`string`)
- **headline** (`string`)
- **website** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **bio** (`string`)
  - **headline** (`string`)
  - **id** (`string`)
  - **rating_avg** (`number`)
  - **total_students** (`integer`)
  - **updated_at** (`string`)
  - **user_id** (`string`)
  - **website** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/profile/tutor/{id}

**Summary**: ReadTutorProfileController

**Description**: ReadTutorProfileController for Profile

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **bio** (`string`)
  - **headline** (`string`)
  - **id** (`string`)
  - **rating_avg** (`number`)
  - **total_students** (`integer`)
  - **updated_at** (`string`)
  - **user_id** (`string`)
  - **website** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/profile/user

**Summary**: ReadUserProfileController

**Description**: ReadUserProfileController for Profile

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **bio** (`string`)
  - **headline** (`string`)
  - **id** (`string`)
  - **updated_at** (`string`)
  - **user_id** (`string`)
  - **website** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/profile/user

**Summary**: UpsertUserProfileController

**Description**: UpsertUserProfileController for Profile

### Request Body
```markdown
- **bio** (`string`)
- **headline** (`string`)
- **website** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **bio** (`string`)
  - **headline** (`string`)
  - **id** (`string`)
  - **updated_at** (`string`)
  - **user_id** (`string`)
  - **website** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/quiz/lesson/{lessonID}

**Summary**: CreateMetadataController

**Description**: CreateMetadataController for Quiz

### Path Parameters
- **lessonID** (`string`): lessonID

### Request Body
```markdown
- **pass_score_percent** (`integer`)
- **time_limit_seconds** (`integer`)
- **title** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
  - **lesson_id** (`string`)
  - **pass_score_percent** (`integer`)
  - **time_limit_seconds** (`integer`)
  - **title** (`string`)
  - **total_questions** (`integer`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/quiz/lesson/{lessonID}/next

**Summary**: ReadNextQuestionController

**Description**: ReadNextQuestionController for Quiz

### Path Parameters
- **lessonID** (`string`): lessonID

### Request Body
```markdown
- **attempt_id** (`string`)
- **fetched_question_ids** (`array of string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **attempt_id** (`string`)
  - **question** (`object`)
    - **arrange_items** (`array of objects`)
      - **id** (`string`)
      - **item_text** (`string`)
    - **fill_blank_hint** (`string`)
    - **id** (`string`)
    - **options** (`array of objects`)
      - **id** (`string`)
      - **option_text** (`string`)
    - **points** (`integer`)
    - **question_text** (`string`)
    - **question_type** (`string`)
  - **remaining_questions** (`integer`)
  - **time_remaining_seconds** (`integer`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/quiz/lesson/{lessonID}/start

**Summary**: CreateAttemptController

**Description**: CreateAttemptController for Quiz

### Path Parameters
- **lessonID** (`string`): lessonID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **correct_count** (`integer`)
  - **id** (`string`)
  - **incorrect_count** (`integer`)
  - **passed** (`boolean`)
  - **quiz_id** (`string`)
  - **skipped_count** (`integer`)
  - **started_at** (`string`)
  - **submitted_at** (`string`)
  - **total_score** (`number`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/quiz/lesson/{lessonID}/submit

**Summary**: CreateSubmitController

**Description**: CreateSubmitController for Quiz

### Path Parameters
- **lessonID** (`string`): lessonID

### Request Body
```markdown
- **answers** (`array of objects`)
  - **arrange_order** (`array of integer`)
  - **fill_text** (`string`)
  - **is_skipped** (`boolean`)
  - **question_id** (`string`)
  - **selected_option_ids** (`array of string`)
- **attempt_id** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **attempt_id** (`string`)
  - **correct_count** (`integer`)
  - **incorrect_count** (`integer`)
  - **passed** (`boolean`)
  - **results** (`array of objects`)
    - **correct_arrange_order** (`array of integer`)
    - **correct_fill_answers** (`array of string`)
    - **correct_option_ids** (`array of string`)
    - **is_correct** (`boolean`)
    - **question_id** (`string`)
  - **skipped_count** (`integer`)
  - **total_score** (`number`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/quiz/questions/{id}

**Summary**: DeleteQuestionController

**Description**: DeleteQuestionController for Quiz

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/quiz/{quizID}/questions

**Summary**: CreateQuestionController

**Description**: CreateQuestionController for Quiz

### Path Parameters
- **quizID** (`string`): quizID

### Request Body
```markdown
- **arrange_items** (`array of objects`)
  - **correct_order** (`integer`)
  - **item_text** (`string`)
- **fill_answers** (`array of string`)
- **fill_blank_hint** (`string`)
- **options** (`array of objects`)
  - **is_correct** (`boolean`)
  - **option_text** (`string`)
- **points** (`integer`)
- **question_text** (`string`)
- **question_type** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **fill_blank_hint** (`string`)
  - **id** (`string`)
  - **points** (`integer`)
  - **question_text** (`string`)
  - **question_type** (`string`)
  - **quiz_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/transactions

**Summary**: ListController

**Description**: ListController for Transactions

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **amount** (`number`)
    - **confirmed_at** (`string`)
    - **coupon** (`object`)
      - **code** (`string`)
      - **discount_value** (`number`)
      - **id** (`string`)
    - **course** (`object`)
      - **id** (`string`)
      - **thumbnail** (`string`)
      - **title** (`string`)
    - **created_at** (`string`)
    - **currency** (`string`)
    - **error_description** (`string`)
    - **id** (`string`)
    - **razorpay_order_id** (`string`)
    - **razorpay_payment_id** (`string`)
    - **status** (`string`)
    - **user** (`object`)
      - **id** (`string`)
      - **image** (`string`)
      - **name** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/transactions/initiate

**Summary**: CreateController

**Description**: CreateController for Transactions

### Request Body
```markdown
- **coupon_code** (`string`)
- **course_id** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **amount** (`number`)
  - **currency** (`string`)
  - **razorpay_key** (`string`)
  - **razorpay_order_id** (`string`)
  - **transaction_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/transactions/me

**Summary**: ListOwnController

**Description**: ListOwnController for Transactions

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **amount** (`number`)
    - **confirmed_at** (`string`)
    - **coupon** (`object`)
      - **code** (`string`)
      - **discount_value** (`number`)
      - **id** (`string`)
    - **course** (`object`)
      - **id** (`string`)
      - **thumbnail** (`string`)
      - **title** (`string`)
    - **created_at** (`string`)
    - **currency** (`string`)
    - **error_description** (`string`)
    - **id** (`string`)
    - **razorpay_order_id** (`string`)
    - **razorpay_payment_id** (`string`)
    - **status** (`string`)
    - **user** (`object`)
      - **id** (`string`)
      - **image** (`string`)
      - **name** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/transactions/webhook

**Summary**: WebhookController

**Description**: WebhookController for Transactions

### Response
**Status 200**

```markdown
- **data** (`null`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/updates

**Summary**: ListController

**Description**: ListController for Updates

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **course** (`object`)
      - **id** (`string`)
      - **thumbnail** (`string`)
      - **title** (`string`)
    - **created_at** (`string`)
    - **created_by** (`string`)
    - **id** (`string`)
    - **message** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/updates

**Summary**: CreateController

**Description**: CreateController for Updates

### Request Body
```markdown
- **course_id** (`string`)
- **message** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **created_at** (`string`)
  - **created_by** (`string`)
  - **id** (`string`)
  - **message** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/updates/feed

**Summary**: FeedController

**Description**: FeedController for Updates

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **older** (`object`)
    - **data** (`array of objects`)
      - **course** (`object`)
        - **id** (`string`)
        - **thumbnail** (`string`)
        - **title** (`string`)
      - **created_at** (`string`)
      - **id** (`string`)
      - **message** (`string`)
    - **limit** (`integer`)
    - **page** (`integer`)
    - **total** (`integer`)
  - **unseen** (`array of objects`)
    - **course** (`object`)
      - **id** (`string`)
      - **thumbnail** (`string`)
      - **title** (`string`)
    - **created_at** (`string`)
    - **id** (`string`)
    - **message** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/updates/{id}

**Summary**: DeleteController

**Description**: DeleteController for Updates

### Path Parameters
- **id** (`string`): id

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## PATCH /api/v1/updates/{id}

**Summary**: UpdateController

**Description**: UpdateController for Updates

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **message** (`string`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **created_at** (`string`)
  - **created_by** (`string`)
  - **id** (`string`)
  - **message** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/users

**Summary**: ListController

**Description**: ListController for Users

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **data** (`array of objects`)
    - **banned** (`boolean`)
    - **createdAt** (`string`)
    - **email** (`string`)
    - **emailVerified** (`boolean`)
    - **id** (`string`)
    - **image** (`string`)
    - **name** (`string`)
    - **roles** (`array of objects`)
      - **id** (`integer`)
      - **name** (`string`)
  - **limit** (`integer`)
  - **page** (`integer`)
  - **total** (`integer`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/users/{id}/roles/assign

**Summary**: AssignRoleController

**Description**: AssignRoleController for Users

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **role_id** (`integer`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **role_id** (`integer`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/users/{id}/roles/revoke

**Summary**: DeleteRoleController

**Description**: DeleteRoleController for Users

### Path Parameters
- **id** (`string`): id

### Request Body
```markdown
- **role_id** (`integer`)
```

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **role_id** (`integer`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## GET /api/v1/wishlist

**Summary**: ListController

**Description**: ListController for Wishlist

### Response
**Status 200**

```markdown
- **data** (`array of objects`)
  - **added_at** (`string`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **id** (`string`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## POST /api/v1/wishlist/course/{courseID}

**Summary**: CreateController

**Description**: CreateController for Wishlist

### Path Parameters
- **courseID** (`string`): courseID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **added_at** (`string`)
  - **course** (`object`)
    - **id** (`string`)
    - **thumbnail** (`string`)
    - **title** (`string`)
  - **id** (`string`)
  - **user_id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

## DELETE /api/v1/wishlist/course/{courseID}

**Summary**: DeleteController

**Description**: DeleteController for Wishlist

### Path Parameters
- **courseID** (`string`): courseID

### Response
**Status 200**

```markdown
- **data** (`object`)
  - **id** (`string`)
- **errors** (`null | string | array of string`)
- **message** (`string`)
- **success** (`boolean`)
```

---

