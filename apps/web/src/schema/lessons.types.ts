import { z } from 'zod';

export const LessonZod = z.object({
    id: z.string(),
    chapter_id: z.string(),
    lesson_no: z.number(),
    title: z.string(),
    lesson_type: z.string(),
    short_description: z.string().nullable().optional(),
    preview_video_url: z.string().nullable().optional(),
    duration_seconds: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Lesson = z.infer<typeof LessonZod>;

export const LessonVideoContentZod = z.object({
    lesson_id: z.string(),
    video_url: z.string(),
    written_content: z.string().nullable().optional(),
});
export type LessonVideoContent = z.infer<typeof LessonVideoContentZod>;

export const LessonDocumentContentZod = z.object({
    lesson_id: z.string(),
    content: z.string(),
});
export type LessonDocumentContent = z.infer<typeof LessonDocumentContentZod>;

export const LessonResourceZod = z.object({
    id: z.string(),
    title: z.string(),
    file_url: z.string(),
    file_type: z.string().nullable().optional(),
});
export type LessonResource = z.infer<typeof LessonResourceZod>;

export const QuizMetadataMiniZod = z.object({
    id: z.string(),
    lesson_id: z.string(),
    title: z.string(),
    time_limit_seconds: z.number(),
    total_questions: z.number(),
    pass_score_percent: z.number(),
});
export type QuizMetadataMini = z.infer<typeof QuizMetadataMiniZod>;

export const AggregatedLessonContentResponseZod = z.object({
    lesson_type: z.string(),
    video_content: LessonVideoContentZod.nullable().optional(),
    document_content: LessonDocumentContentZod.nullable().optional(),
    quiz_content: QuizMetadataMiniZod.nullable().optional(),
});
export type AggregatedLessonContentResponse = z.infer<typeof AggregatedLessonContentResponseZod>;

// lesson_no is auto-incremented server-side — never sent by the client.
export const CreateLessonRequestZod = z.object({
    title: z.string(),
    lesson_type: z.string(),
    short_description: z.string().nullable().optional(),
    preview_video_url: z.string().nullable().optional(),
    duration_seconds: z.number(),
});
export type CreateLessonRequest = z.infer<typeof CreateLessonRequestZod>;

export const UpdateLessonRequestZod = z.object({
    title: z.string().optional(),
    short_description: z.string().nullable().optional(),
    preview_video_url: z.string().nullable().optional(),
    duration_seconds: z.number().optional(),
});
export type UpdateLessonRequest = z.infer<typeof UpdateLessonRequestZod>;

export const UpsertVideoContentRequestZod = z.object({
    video_url: z.string(),
    written_content: z.string().nullable().optional(),
});
export type UpsertVideoContentRequest = z.infer<typeof UpsertVideoContentRequestZod>;

export const UpsertDocumentContentRequestZod = z.object({
    content: z.string(),
});
export type UpsertDocumentContentRequest = z.infer<typeof UpsertDocumentContentRequestZod>;

export const AddResourceRequestZod = z.object({
    title: z.string(),
    file_url: z.string(),
    file_type: z.string().nullable().optional(),
});
export type AddResourceRequest = z.infer<typeof AddResourceRequestZod>;

export const SignedURLResponseZod = z.object({
    url: z.string(),
});
export type SignedURLResponse = z.infer<typeof SignedURLResponseZod>;

export const LessonCompleteResponseZod = z.object({
    lesson_id: z.string(),
    completed: z.boolean(),
});
export type LessonCompleteResponse = z.infer<typeof LessonCompleteResponseZod>;
