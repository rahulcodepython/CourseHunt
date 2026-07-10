import { z } from 'zod';
import { CourseInfoZod } from './common.types';

export const WishlistZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course: CourseInfoZod,
    added_at: z.string(),
});
export type Wishlist = z.infer<typeof WishlistZod>;
export const WishlistRemoveResponseZod = z.any(); export type WishlistRemoveResponse = any;
