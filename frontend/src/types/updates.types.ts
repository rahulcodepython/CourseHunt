import { z } from 'zod';
import { CourseInfoZod, PaginatedResponseZod } from '@/types/common.types';

// ── DB Row Structs ────────────────────────────────────────────────────────────

export const CourseUpdateZod = z.object({
    id: z.string(),
    course: CourseInfoZod,
    created_by: z.string().optional(),
    message: z.string(),
    created_at: z.string(),
});
export type CourseUpdate = z.infer<typeof CourseUpdateZod>;

// ── Requests ──────────────────────────────────────────────────────────────────

export const CreateUpdateRequestZod = z.object({
    message: z.string(),
    course_id: z.string().optional(),
});
export type CreateUpdateRequest = z.infer<typeof CreateUpdateRequestZod>;

export const UpdateUpdateRequestZod = z.object({
    message: z.string(),
});
export type UpdateUpdateRequest = z.infer<typeof UpdateUpdateRequestZod>;

// ── Update Feed Response ──────────────────────────────────────────────────────

export const UpdateFeedItemZod = z.object({
    id: z.string(),
    message: z.string(),
    course: CourseInfoZod,
    created_at: z.string(),
});
export type UpdateFeedItem = z.infer<typeof UpdateFeedItemZod>;

export const UpdateFeedResponseZod = z.object({
    unseen: z.array(UpdateFeedItemZod).nullable().optional(), // Adding nullable/optional as fallback for empty slices in Go
    older: PaginatedResponseZod(z.array(UpdateFeedItemZod)),
});
export type UpdateFeedResponse = z.infer<typeof UpdateFeedResponseZod>;