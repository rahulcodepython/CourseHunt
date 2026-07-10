import { z } from 'zod';

export const UpsertNoteRequestZod = z.object({
    content: z.string(),
});
export type UpsertNoteRequest = z.infer<typeof UpsertNoteRequestZod>;

export const NoteResponseZod = z.object({
    id: z.string(),
    content: z.string(),
    updated_at: z.string(),
});
export type NoteResponse = z.infer<typeof NoteResponseZod>;

export const UserNoteZod = z.object({
    id: z.string(),
    user_id: z.string(),
    lesson_id: z.string(),
    course_id: z.string(),
    content: z.string(),
    updated_at: z.string(),
});
export type UserNote = z.infer<typeof UserNoteZod>;
export const NoteDeleteResponseZod = z.any(); export type NoteDeleteResponse = any;
