import { z } from 'zod';
import { UserInfoZod } from './common.types';

export const CreateDiscussionRequestZod = z.object({
    content: z.string(),
    parent_id: z.string().optional(),
});
export type CreateDiscussionRequest = z.infer<typeof CreateDiscussionRequestZod>;

export const UpdateDiscussionRequestZod = z.object({
    content: z.string(),
});
export type UpdateDiscussionRequest = z.infer<typeof UpdateDiscussionRequestZod>;

export const DiscussionResponseZod = z.object({
    id: z.string(),
    content: z.string(),
    depth: z.number(),
    reply_count: z.number(),
    created_at: z.string(),
    user: UserInfoZod,
});
export type DiscussionResponse = z.infer<typeof DiscussionResponseZod>;

export const DiscussionZod = z.object({
    id: z.string(),
    lesson_id: z.string(),
    course_id: z.string(),
    user: UserInfoZod,
    parent_id: z.string().optional(),
    content: z.string(),
    depth: z.number(),
    reply_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Discussion = z.infer<typeof DiscussionZod>;
export const DiscussionDeleteResponseZod = z.any(); export type DiscussionDeleteResponse = any;
