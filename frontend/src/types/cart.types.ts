import { z } from 'zod';
import { CourseInfoZod } from './common.types';

export const CartItemZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course: CourseInfoZod,
    added_at: z.string(),
});
export type CartItem = z.infer<typeof CartItemZod>;