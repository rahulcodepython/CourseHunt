import { z } from 'zod';
import { CourseInfoZod } from '@/package/schema/common.types';

export const WishlistItemZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course: CourseInfoZod,
    added_at: z.string(),
});
export type WishlistItem = z.infer<typeof WishlistItemZod>;

export const CreateWishlistRequestZod = z.object({
    course_id: z.string(),
});
export type CreateWishlistRequest = z.infer<typeof CreateWishlistRequestZod>;
