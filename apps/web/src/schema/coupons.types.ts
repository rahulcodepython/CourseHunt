import { z } from "zod";
import { CourseInfoZod } from "@/schema/common.types";

export const CreateCouponRequestZod = z.object({
  code: z.string().min(3).max(50),
  course_id: z.string().nullable().optional(),
  discount_percent: z.number().min(1).max(100),
  max_usage: z.number().min(1),
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
  reason: z.string().nullable().optional(),
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
  created_by: z.string().nullable().optional(),
  created_at: z.string(),
});
export type Coupon = z.infer<typeof CouponZod>;
