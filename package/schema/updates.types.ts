import { z } from 'zod';
import { CourseInfoZod, PaginatedResponseZod } from '@/package/schema/common.types';

export const CourseUpdateZod = z.object({
    id: z.string(),
    course: CourseInfoZod,
    created_by: z.string().nullable().optional(),
    message: z.string(),
    created_at: z.string(),
});
export type CourseUpdate = z.infer<typeof CourseUpdateZod>;

export const CreateUpdateRequestZod = z.object({
    message: z.string(),
    course_id: z.string().nullable().optional(),
});
export type CreateUpdateRequest = z.infer<typeof CreateUpdateRequestZod>;

export const UpdateUpdateRequestZod = z.object({
    message: z.string(),
});
export type UpdateUpdateRequest = z.infer<typeof UpdateUpdateRequestZod>;

export const UpdateFeedItemZod = z.object({
    id: z.string(),
    message: z.string(),
    course: CourseInfoZod,
    created_at: z.string(),
    is_unseen: z.boolean(),
});
export type UpdateFeedItem = z.infer<typeof UpdateFeedItemZod>;

export const UpdateFeedResponseZod = z.object({
    updates: PaginatedResponseZod(UpdateFeedItemZod),
});
export type UpdateFeedResponse = z.infer<typeof UpdateFeedResponseZod>;


