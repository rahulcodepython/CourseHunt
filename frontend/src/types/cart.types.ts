import { z } from 'zod';
import { CourseInfoZod } from './common.types';

export const CartItemZod = z.object({
    id: z.string(),
    user_id: z.string(),
    course: CourseInfoZod,
    added_at: z.string(),
});
export type CartItem = z.infer<typeof CartItemZod>;

export const CartItemIdZod = z.object({
    id: z.string(),
});
export type CartItemId = z.infer<typeof CartItemIdZod>;

export const CartItemIdZod = z.object({
    id: z.string(),
});
export type CartItemId = z.infer<typeof CartItemIdZod>;
export const CartClearResponseZod = z.any(); export type CartClearResponse = any;
export const CartRemoveResponseZod = z.any(); export type CartRemoveResponse = any;
