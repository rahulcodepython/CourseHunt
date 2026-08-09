import { z } from 'zod';
import { CourseInfoZod, UserInfoZod } from "@package/schema/common.types";

export const FeedbackZod = z.object({
    id: z.string(),
    course: CourseInfoZod,
    user: UserInfoZod,
    rating: z.number(),
    content: z.string().nullable().optional(),
    is_pinned: z.boolean(),
    created_at: z.string(),
});
export type Feedback = z.infer<typeof FeedbackZod>;

export const CreateFeedbackRequestZod = z.object({
    rating: z.number(),
    content: z.string().nullable().optional(),
    course_id: z.string(),
});
export type CreateFeedbackRequest = z.infer<typeof CreateFeedbackRequestZod>;

export const PinFeedbackRequestZod = z.object({
    is_pinned: z.boolean(),
});
export type PinFeedbackRequest = z.infer<typeof PinFeedbackRequestZod>;
