import { z } from "zod";
import { CategoryInfoZod, InstructorInfoZod } from "@/schema/common.types";

// status isn't part of this request — a course always starts in "draft" and
// is changed afterward via UpdateCourseRequest's dedicated status action.
export const CreateCourseRequestZod = z.object({
  title: z.string(),
  short_description: z.string().nullable().optional(),
  long_description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  preview_video_url: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  language: z.string(),
  level: z.string(),
  actual_price: z.number().optional(),
  final_price: z.number().optional(),
  benefits: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  coupon_allowed: z.boolean().optional(),
  is_free: z.boolean().optional(),
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
  coupon_allowed: z.boolean().optional(),
  is_free: z.boolean().optional(),
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
  unlock_days_after_enrollment: z.number().optional(),
  unlock_at: z.string().nullable().optional(),
  prerequisite_chapter_id: z.string().nullable().optional(),
  is_locked: z.boolean().optional().default(false),
  lock_reason: z.string().nullable().optional(),
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
  is_free: z.boolean(),
  benefits: z.array(z.string()),
  requirements: z.array(z.string()),
  category: CategoryInfoZod.nullable().optional(),
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

export const CourseZod = z.object({
  id: z.string(),
  tutor_id: z.string().nullable().optional(),
  slug: z.string(),
  title: z.string(),
  short_description: z.string().nullable().optional(),
  long_description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  preview_video_url: z.string().nullable().optional(),
  language: z.string(),
  level: z.string(),
  actual_price: z.coerce.number(),
  final_price: z.coerce.number(),
  benefits: z.array(z.string()).nullish().transform((v) => v ?? []),
  requirements: z.array(z.string()).nullish().transform((v) => v ?? []),
  category_id: z.string().nullable().optional(),
  coupon_allowed: z.boolean().optional().default(true),
  is_free: z.boolean().optional().default(false),
  total_lectures: z.coerce.number().optional().default(0),
  total_duration_seconds: z.coerce.number().optional().default(0),
  rating_avg: z.coerce.number().optional().default(0),
  feedback_count: z.coerce.number().optional().default(0),
  student_count: z.coerce.number().optional().default(0),
  status: z.string(),
  tutor: z
    .object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Course = z.infer<typeof CourseZod>;

export const AdminCourseItemZod = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  image_url: z.string().nullable().optional(),
  status: z.string(),
  final_price: z.coerce.number(),
  total_lectures: z.coerce.number().optional().default(0),
  rating_avg: z.coerce.number().optional().default(0),
  student_count: z.coerce.number().optional().default(0),
  tutor: z
    .object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type AdminCourseItem = z.infer<typeof AdminCourseItemZod>;

export const AdminCourseDetailZod = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  short_description: z.string().nullable().optional(),
  long_description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  language: z.string(),
  level: z.string(),
  actual_price: z.coerce.number(),
  final_price: z.coerce.number(),
  benefits: z.array(z.string()).nullish().transform((v) => v ?? []),
  requirements: z.array(z.string()).nullish().transform((v) => v ?? []),
  coupon_allowed: z.boolean().optional().default(true),
  is_free: z.boolean().optional().default(false),
  total_lectures: z.coerce.number().optional().default(0),
  total_duration_seconds: z.coerce.number().optional().default(0),
  rating_avg: z.coerce.number().optional().default(0),
  feedback_count: z.coerce.number().optional().default(0),
  student_count: z.coerce.number().optional().default(0),
  status: z.string(),
  tutor: z
    .object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AdminCourseDetail = z.infer<typeof AdminCourseDetailZod>;

export const DailySalesPointZod = z.object({
  day: z.string(),
  date: z.string(),
  revenue: z.coerce.number(),
  count: z.coerce.number(),
});
export type DailySalesPoint = z.infer<typeof DailySalesPointZod>;

export const MonthlySalesPointZod = z.object({
  month: z.string(),
  year_month: z.string(),
  revenue: z.coerce.number(),
  count: z.coerce.number(),
});
export type MonthlySalesPoint = z.infer<typeof MonthlySalesPointZod>;

export const CourseAnalyticsResponseZod = z.object({
  daily_sales: z.array(DailySalesPointZod).nullish().transform((v) => v ?? []),
  monthly_sales: z.array(MonthlySalesPointZod).nullish().transform((v) => v ?? []),
});
export type CourseAnalyticsResponse = z.infer<typeof CourseAnalyticsResponseZod>;

export const CourseStudyResponseZod = z.object({
  course: z.object({
    id: z.string(),
    title: z.string(),
    thumbnail: z.string().nullable().optional(),
  }),
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
  is_free: z.boolean(),
  benefits: z.array(z.string()),
  level: z.string(),
  rating_avg: z.number(),
  feedback_count: z.number(),
  category: CategoryInfoZod.nullable().optional(),
  instructor: InstructorInfoZod,
});
export type CoursePublicResponse = z.infer<typeof CoursePublicResponseZod>;

export const CourseOptionZod = z.object({
  id: z.string(),
  title: z.string(),
});
export type CourseOption = z.infer<typeof CourseOptionZod>;

export const CourseSummaryZod = z.object({
  id: z.string(),
  title: z.string(),
});
export type CourseSummary = z.infer<typeof CourseSummaryZod>;
