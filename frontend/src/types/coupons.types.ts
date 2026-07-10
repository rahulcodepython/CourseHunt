import { z } from 'zod';
import { CourseInfoZod } from './common.types';

export const CreateCouponRequestZod = z.object({
    code: z.string(),
    course_id: z.string().optional(),
    discount_percent: z.number(),
    max_usage: z.number(),
    expires_at: z.string(),
    is_active: z.boolean(),
});
export type CreateCouponRequest = z.infer<typeof CreateCouponRequestZod>;

export const UpdateCouponRequestZod = z.object({
    discount_percent: z.number().optional(),
    max_usage: z.number().optional(),
    expires_at: z.string().optional(),
    is_active: z.boolean().optional(),
});
export type UpdateCouponRequest = z.infer<typeof UpdateCouponRequestZod>;

export const CouponCheckResponseZod = z.object({
    valid: z.boolean(),
    discount_percent: z.number(),
    reason: z.string().optional(),
});
export type CouponCheckResponse = z.infer<typeof CouponCheckResponseZod>;

export const CouponZod = z.object({
    id: z.string(),
    code: z.string(),
    course: CourseInfoZod,
    discount_percent: z.number(),
    max_usage: z.number(),
    usage_count: z.number(),
    expires_at: z.string(),
    is_active: z.boolean(),
    created_by: z.string().optional(),
    created_at: z.string(),
});
export type Coupon = z.infer<typeof CouponZod>;
export const CouponDeleteResponseZod = z.any(); export type CouponDeleteResponse = any;
