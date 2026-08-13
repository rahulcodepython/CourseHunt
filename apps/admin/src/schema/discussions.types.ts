import { z } from 'zod';
import { UserInfoZod } from "@package/schema/common.types";

export const CreateDiscussionRequestZod = z.object({
    content: z.string(),
    parent_id: z.string().nullable().optional(),
    lesson_id: z.string(),
});
export type CreateDiscussionRequest = z.infer<typeof CreateDiscussionRequestZod>;

export const UpdateDiscussionRequestZod = z.object({
    content: z.string(),
});
export type UpdateDiscussionRequest = z.infer<typeof UpdateDiscussionRequestZod>;

export const DiscussionZod = z.object({
    id: z.string(),
    lesson_id: z.string(),
    course_id: z.string(),
    user: UserInfoZod,
    parent_id: z.string().nullable().optional(),
    content: z.string(),
    reply_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Discussion = z.infer<typeof DiscussionZod>;
