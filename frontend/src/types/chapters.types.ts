import { z } from 'zod';

export const ChapterZod = z.object({
    id: z.string(),
    course_id: z.string(),
    chapter_no: z.number(),
    title: z.string(),
    total_lectures: z.number(),
    total_duration_seconds: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Chapter = z.infer<typeof ChapterZod>;

export const CreateChapterRequestZod = z.object({
    title: z.string(),
    chapter_no: z.number(),
});
export type CreateChapterRequest = z.infer<typeof CreateChapterRequestZod>;

export const UpdateChapterRequestZod = z.object({
    title: z.string().optional(),
    chapter_no: z.number().optional(),
});
export type UpdateChapterRequest = z.infer<typeof UpdateChapterRequestZod>;
export const ChapterDeleteResponseZod = z.any(); export type ChapterDeleteResponse = any;
