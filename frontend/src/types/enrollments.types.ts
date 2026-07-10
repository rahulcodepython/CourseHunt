import { z } from 'zod';
import { CourseInfoZod, UserInfoZod } from "./common.types";

export const EnrollmentZod = z.object({
    id: z.string(),
    user: UserInfoZod,
    course: CourseInfoZod,
    completion_percent: z.number(),
    completed: z.boolean(),
    last_accessed_lesson_id: z.string().optional(),
    revoked: z.boolean(),
    enrolled_at: z.string(),
});
export type Enrollment = z.infer<typeof EnrollmentZod>;

export const LessonProgressZod = z.object({
    id: z.string(),
    user_id: z.string(),
    lesson_id: z.string(),
    course_id: z.string(),
    completed: z.boolean(),
    completed_at: z.string().optional(),
});
export type LessonProgress = z.infer<typeof LessonProgressZod>;

export const ChapterProgressZod = z.object({
    id: z.string(),
    user_id: z.string(),
    chapter_id: z.string(),
    course_id: z.string(),
    lessons_completed: z.number(),
    completed: z.boolean(),
});
export type ChapterProgress = z.infer<typeof ChapterProgressZod>;

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

export const ManualEnrollRequestZod = z.object({
    user_id: z.string(),
});
export type ManualEnrollRequest = z.infer<typeof ManualEnrollRequestZod>;
