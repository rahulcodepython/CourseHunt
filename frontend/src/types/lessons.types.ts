import { z } from 'zod';

// ── DB Row Structs ────────────────────────────────────────────────────────────

export const LessonZod = z.object({
    id: z.string(),
    chapter_id: z.string(),
    lesson_no: z.number(),
    title: z.string(),
    lesson_type: z.string(),
    // Note: ShortDescription and PreviewVideoURL are omitted because of `json:"-"`
    duration_seconds: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Lesson = z.infer<typeof LessonZod>;

export const LessonVideoContentZod = z.object({
    id: z.string(),
    video_url: z.string(),
    written_content: z.string().optional(),
});
export type LessonVideoContent = z.infer<typeof LessonVideoContentZod>;

export const LessonDocumentContentZod = z.object({
    id: z.string(),
    content: z.string(),
});
export type LessonDocumentContent = z.infer<typeof LessonDocumentContentZod>;

export const LessonResourceZod = z.object({
    id: z.string(),
    title: z.string(),
    file_url: z.string(),
    file_type: z.string().optional(),
});
export type LessonResource = z.infer<typeof LessonResourceZod>;

// ── Lessons ───────────────────────────────────────────────────────────────────

export const CreateLessonRequestZod = z.object({
    title: z.string(),
    lesson_no: z.number(),
    lesson_type: z.string(),
    short_description: z.string().optional(),
    preview_video_url: z.string().optional(),
    duration_seconds: z.number(),
});
export type CreateLessonRequest = z.infer<typeof CreateLessonRequestZod>;

export const UpdateLessonRequestZod = z.object({
    title: z.string().optional(),
    lesson_no: z.number().optional(),
    short_description: z.string().optional(),
    preview_video_url: z.string().optional(),
    duration_seconds: z.number().optional(),
});
export type UpdateLessonRequest = z.infer<typeof UpdateLessonRequestZod>;

export const UpsertVideoContentRequestZod = z.object({
    video_url: z.string(),
    written_content: z.string().optional(),
});
export type UpsertVideoContentRequest = z.infer<typeof UpsertVideoContentRequestZod>;

export const UpsertDocumentContentRequestZod = z.object({
    content: z.string(),
});
export type UpsertDocumentContentRequest = z.infer<typeof UpsertDocumentContentRequestZod>;

export const AddResourceRequestZod = z.object({
    title: z.string(),
    file_url: z.string(),
    file_type: z.string().optional(),
});
export type AddResourceRequest = z.infer<typeof AddResourceRequestZod>;

export const LessonContentResponseZod = <T extends z.ZodTypeAny>(contentSchema: T) =>
    z.object({
        content: contentSchema.nullable().optional(),
    });

export type LessonContentResponse<T> = {
    content?: T | null;
};

export const SignedURLResponseZod = z.object({
    url: z.string(),
});
export type SignedURLResponse = z.infer<typeof SignedURLResponseZod>;

export const LessonCompleteResponseZod = z.object({
    lesson_id: z.string(),
    completed: z.boolean(),
});
export type LessonCompleteResponse = z.infer<typeof LessonCompleteResponseZod>;