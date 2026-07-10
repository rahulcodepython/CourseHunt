import { z } from 'zod';
import { CourseInfoZod } from '@/types/common.types';

// ── DB Row Structs ────────────────────────────────────────────────────────────

export const WishlistZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course: CourseInfoZod,
    added_at: z.string(),
});
export type Wishlist = z.infer<typeof WishlistZod>;