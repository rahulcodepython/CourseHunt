import { z } from 'zod';
import { CategoryInfoZod, InstructorInfoZod } from '@/package/schema/common.types';

export const CreateCourseRequestZod = z.object({
    title: z.string(),
    short_description: z.string().nullable().optional(),
    category_id: z.string().nullable().optional(),
    subcategory_id: z.string().nullable().optional(),
    language: z.string(),
    level: z.string(),
    status: z.string(),
});
export type CreateCourseRequest = z.infer<typeof CreateCourseRequestZod>;

export const UpdateCourseRequestZod = z.object({
    title: z.string().optional(),
    short_description: z.string().nullable().optional(),
    long_description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    preview_video_url: z.string().nullable().optional(),
    language: z.string().optional(),
    level: z.string().optional(),
    actual_price: z.number().optional(),
    final_price: z.number().optional(),
    benefits: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    category_id: z.string().nullable().optional(),
    subcategory_id: z.string().nullable().optional(),
    coupon_allowed: z.boolean().optional(),
    status: z.string().optional(),
});
export type UpdateCourseRequest = z.infer<typeof UpdateCourseRequestZod>;

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

export const LessonCardResponseZod = z.object({
    id: z.string(),
    lesson_no: z.number(),
    title: z.string(),
    lesson_type: z.string(),
    short_description: z.string().nullable().optional(),
    preview_video_url: z.string().nullable().optional(),
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
    short_description: z.string().nullable().optional(),
    long_description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    preview_video_url: z.string().nullable().optional(),
    language: z.string(),
    level: z.string(),
    actual_price: z.number(),
    final_price: z.number(),
    benefits: z.array(z.string()),
    requirements: z.array(z.string()),
    category: CategoryInfoZod.nullable().optional(),
    subcategory: CategoryInfoZod.nullable().optional(),
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
    image_url: z.string().nullable().optional(),
    completion_percent: z.number(),
    last_accessed_lesson_id: z.string().nullable().optional(),
});
export type EnrolledCourseResponse = z.infer<typeof EnrolledCourseResponseZod>;

export const CourseCreatedResponseZod = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    status: z.string(),
    created_at: z.string(),
});
export type CourseCreatedResponse = z.infer<typeof CourseCreatedResponseZod>;

export const CourseStudyResponseZod = z.object({
    course: z.object({ id: z.string(), title: z.string(), thumbnail: z.string().nullable().optional() }),
    completion_percent: z.number(),
    completed: z.boolean(),
    chapters: z.array(StudyChapterItemZod),
});
export type CourseStudyResponse = z.infer<typeof CourseStudyResponseZod>;

export const CoursePublicResponseZod = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    short_description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    actual_price: z.number(),
    final_price: z.number(),
    benefits: z.array(z.string()),
    level: z.string(),
    rating_avg: z.number(),
    feedback_count: z.number(),
    category: CategoryInfoZod.nullable().optional(),
    subcategory: CategoryInfoZod.nullable().optional(),
    instructor: InstructorInfoZod,
});
export type CoursePublicResponse = z.infer<typeof CoursePublicResponseZod>;

export const CourseInspectResponseZod = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    short_description: z.string().nullable().optional(),
    long_description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    preview_video_url: z.string().nullable().optional(),
    language: z.string(),
    level: z.string(),
    actual_price: z.number(),
    final_price: z.number(),
    benefits: z.array(z.string()),
    requirements: z.array(z.string()),
    coupon_allowed: z.boolean(),
    status: z.string(),
    total_lectures: z.number(),
    total_duration_seconds: z.number(),
    rating_avg: z.number(),
    feedback_count: z.number(),
    student_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    category: CategoryInfoZod.nullable().optional(),
    subcategory: CategoryInfoZod.nullable().optional(),
    instructor: InstructorInfoZod,
    chapters: z.array(ChapterCardResponseZod),
});
export type CourseInspectResponse = z.infer<typeof CourseInspectResponseZod>;
