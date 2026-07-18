import { z } from 'zod';
import { UserInfoZod, CourseInfoZod, CouponInfoZod } from '@/types/common.types';

export const TransactionZod = z.object({
    id: z.string(),
    user: UserInfoZod,
    course: CourseInfoZod,
    coupon: CouponInfoZod,
    razorpay_order_id: z.string().nullable().optional(),
    razorpay_payment_id: z.string().nullable().optional(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    error_description: z.string().nullable().optional(),
    confirmed_at: z.string().nullable().optional(),
    created_at: z.string(),
});
export type Transaction = z.infer<typeof TransactionZod>;

export const InitiateTransactionRequestZod = z.object({
    course_id: z.string(),
    coupon_code: z.string().nullable().optional(),
});
export type InitiateTransactionRequest = z.infer<typeof InitiateTransactionRequestZod>;

export const InitiateTransactionResponseZod = z.object({
    transaction_id: z.string(),
    razorpay_order_id: z.string(),
    amount: z.number(),
    currency: z.string(),
    razorpay_key: z.string(),
});
export type InitiateTransactionResponse = z.infer<typeof InitiateTransactionResponseZod>;
