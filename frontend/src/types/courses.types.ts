import { CategoryInfoZod, CourseInfoZod, InstructorInfoZod } from '@/types/common.types';
import { z } from 'zod';

// ── DB Row Structs ────────────────────────────────────────────────────────────

export const CourseZod = z.object({
    id: z.string(),
    // Note: Fields with `json:"-"` in Go are omitted from this Zod schema.
    slug: z.string(),
    title: z.string(),
    language: z.string(),
    level: z.string(),
    actual_price: z.number(),
    final_price: z.number(),
    benefits: z.array(z.string()),
    requirements: z.array(z.string()),
    coupon_allowed: z.boolean(),
    total_lectures: z.number(),
    total_duration_seconds: z.number(),
    rating_avg: z.number(),
    feedback_count: z.number(),
    status: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Course = z.infer<typeof CourseZod>;

export const StudyLessonItemZod = z.object({
    id: z.string(),
    lesson_no: z.number(),
    title: z.string(),
    lesson_type: z.string(),
    duration_seconds: z.number(),
    completed: z.boolean(),
});
export type StudyLessonItem = z.infer<typeof StudyLessonItemZod>;

export const ChapterProgressInfoZod = z.object({
    lessons_completed: z.number(),
    completed: z.boolean(),
});
export type ChapterProgressInfo = z.infer<typeof ChapterProgressInfoZod>;

export const StudyChapterItemZod = z.object({
    id: z.string(),
    chapter_no: z.number(),
    title: z.string(),
    total_lectures: z.number(),
    total_duration_seconds: z.number(),
    progress: ChapterProgressInfoZod,
    lessons: z.array(StudyLessonItemZod),
});
export type StudyChapterItem = z.infer<typeof StudyChapterItemZod>;

// ── Courses ───────────────────────────────────────────────────────────────────

export const CreateCourseRequestZod = z.object({
    title: z.string(),
    short_description: z.string().optional(),
    category_id: z.string().optional(),
    subcategory_id: z.string().optional(),
    language: z.string(),
    level: z.string(),
    status: z.string(),
});
export type CreateCourseRequest = z.infer<typeof CreateCourseRequestZod>;

export const UpdateCourseRequestZod = z.object({
    title: z.string().optional(),
    short_description: z.string().optional(),
    long_description: z.string().optional(),
    image_url: z.string().optional(),
    preview_video_url: z.string().optional(),
    language: z.string().optional(),
    level: z.string().optional(),
    actual_price: z.number().optional(),
    final_price: z.number().optional(),
    benefits: z.array(z.string()).optional(), // Omitted fields might fallback to optional arrays depending on your Go JSON parser
    requirements: z.array(z.string()).optional(),
    category_id: z.string().optional(),
    subcategory_id: z.string().optional(),
    coupon_allowed: z.boolean().optional(),
    status: z.string().optional(),
});
export type UpdateCourseRequest = z.infer<typeof UpdateCourseRequestZod>;

// ── Course Responses ──────────────────────────────────────────────────────────

export const CourseCardResponseZod = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    short_description: z.string().optional(),
    image_url: z.string().optional(),
    actual_price: z.number(),
    final_price: z.number(),
    benefits: z.array(z.string()),
    level: z.string(),
    rating_avg: z.number(),
    feedback_count: z.number(),
    instructor: InstructorInfoZod,
});
export type CourseCardResponse = z.infer<typeof CourseCardResponseZod>;

export const LessonCardResponseZod = z.object({
    id: z.string(),
    lesson_no: z.number(),
    title: z.string(),
    lesson_type: z.string(),
    short_description: z.string().optional(),
    preview_video_url: z.string().optional(),
    duration_seconds: z.number(),
});
export type LessonCardResponse = z.infer<typeof LessonCardResponseZod>;

export const ChapterCardResponseZod = z.object({
    id: z.string(),
    chapter_no: z.number(),
    title: z.string(),
    total_lectures: z.number(),
    total_duration_seconds: z.number(),
    lessons: z.array(LessonCardResponseZod),
});
export type ChapterCardResponse = z.infer<typeof ChapterCardResponseZod>;

export const CourseLandingResponseZod = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    short_description: z.string().optional(),
    long_description: z.string().optional(),
    image_url: z.string().optional(),
    preview_video_url: z.string().optional(),
    language: z.string(),
    level: z.string(),
    actual_price: z.number(),
    final_price: z.number(),
    benefits: z.array(z.string()),
    requirements: z.array(z.string()),
    category: CategoryInfoZod.optional(),
    subcategory: CategoryInfoZod.optional(),
    instructor: InstructorInfoZod,
    total_lectures: z.number(),
    total_duration_seconds: z.number(),
    rating_avg: z.number(),
    feedback_count: z.number(),
    is_enrolled: z.boolean(),
    chapters: z.array(ChapterCardResponseZod),
});
export type CourseLandingResponse = z.infer<typeof CourseLandingResponseZod>;

export const EnrolledCourseResponseZod = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    image_url: z.string().optional(),
    completion_percent: z.number(),
    last_accessed_lesson_id: z.string().optional(),
});
export type EnrolledCourseResponse = z.infer<typeof EnrolledCourseResponseZod>;

// ── Course Created/Updated Response ───────────────────────────────────────────

export const CourseCreatedResponseZod = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    status: z.string(),
    created_at: z.string(),
});
export type CourseCreatedResponse = z.infer<typeof CourseCreatedResponseZod>;

export const EnrollmentStudyInfoZod = z.object({
    completion_percent: z.number(),
    completed: z.boolean(),
});
export type EnrollmentStudyInfo = z.infer<typeof EnrollmentStudyInfoZod>;

export const CourseStudyResponseZod = z.object({
    course: CourseInfoZod,
    enrollment: EnrollmentStudyInfoZod,
    chapters: z.array(StudyChapterItemZod),
});
export type CourseStudyResponse = z.infer<typeof CourseStudyResponseZod>;