import { z } from 'zod';
import { QuizMetadataZod } from "./quiz.types";

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

export const LessonContentInfoZod = z.object({
    id: z.string(),
    title: z.string(),
    lesson_type: z.string(),
    lesson_no: z.number(),
    chapter_id: z.string(),
});
export type LessonContentInfo = z.infer<typeof LessonContentInfoZod>;

export const LessonBodyContentZod = z.object({
    video_url: z.string().optional(),
    written_content: z.string().optional(),
    content: z.string().optional(),
    quiz_metadata: QuizMetadataZod.optional(),
});
export type LessonBodyContent = z.infer<typeof LessonBodyContentZod>;

export const LessonUserNoteInfoZod = z.object({
    content: z.string().optional(),
});
export type LessonUserNoteInfo = z.infer<typeof LessonUserNoteInfoZod>;

export const LessonResourceZod = z.object({
    id: z.string(),
    lesson_id: z.string(),
    title: z.string(),
    file_url: z.string(),
    file_type: z.string().optional(),
});
export type LessonResource = z.infer<typeof LessonResourceZod>;

export const LessonContentResponseZod = z.object({
    lesson: LessonContentInfoZod,
    content: LessonBodyContentZod,
    resources: z.array(LessonResourceZod),
    user_note: LessonUserNoteInfoZod,
    completed: z.boolean(),
});
export type LessonContentResponse = z.infer<typeof LessonContentResponseZod>;

export const SignedURLResponseZod = z.object({
    url: z.string(),
});
export type SignedURLResponse = z.infer<typeof SignedURLResponseZod>;

export const LessonCompleteResponseZod = z.object({
    lesson_id: z.string(),
    completed: z.boolean(),
});
export type LessonCompleteResponse = z.infer<typeof LessonCompleteResponseZod>;

export const LessonZod = z.object({
    id: z.string(),
    chapter_id: z.string(),
    lesson_no: z.number(),
    title: z.string(),
    lesson_type: z.string(),
    duration_seconds: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Lesson = z.infer<typeof LessonZod>;

export const LessonVideoContentZod = z.object({
    id: z.string(),
    lesson_id: z.string(),
    video_url: z.string(),
    written_content: z.string().optional(),
});
export type LessonVideoContent = z.infer<typeof LessonVideoContentZod>;

export const LessonDocumentContentZod = z.object({
    id: z.string(),
    lesson_id: z.string(),
    content: z.string(),
});
export type LessonDocumentContent = z.infer<typeof LessonDocumentContentZod>;
export const LessonDeleteResponseZod = z.any(); export type LessonDeleteResponse = any;
export const ResourceDeleteResponseZod = z.any(); export type ResourceDeleteResponse = any;
