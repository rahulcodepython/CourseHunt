import { z } from 'zod';
import { CourseInfoZod, UserInfoZod } from '@/types/common.types';

export const FeedbackZod = z.object({
    id: z.string(),
    course: CourseInfoZod,
    user: UserInfoZod,
    rating: z.number(),
    content: z.string().optional(),
    is_pinned: z.boolean(),
    created_at: z.string(),
});
export type Feedback = z.infer<typeof FeedbackZod>;

export const CreateFeedbackRequestZod = z.object({
    rating: z.number(),
    content: z.string().optional(),
});
export type CreateFeedbackRequest = z.infer<typeof CreateFeedbackRequestZod>;