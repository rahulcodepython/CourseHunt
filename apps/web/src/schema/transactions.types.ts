import { z } from 'zod';
import { UserInfoZod, CourseInfoZod, CouponInfoZod, InstructorInfoZod } from "@/schema/common.types";

export const TransactionZod = z.object({
    id: z.string(),
    user: UserInfoZod,
    course: CourseInfoZod,
    coupon: CouponInfoZod,
    razorpay_order_id: z.string().nullable().optional(),
    razorpay_payment_id: z.string().nullable().optional(),
    amount: z.number(),
    actual_price: z.number(),
    offered_price: z.number(),
    tax_percent: z.number(),
    discount_amount: z.number(),
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

export const TransactionStatusResponseZod = z.object({
    id: z.string(),
    status: z.string(),
    error_description: z.string().nullable().optional(),
    webhook_processed: z.boolean(),
    razorpay_order_id: z.string().nullable().optional(),
});
export type TransactionStatusResponse = z.infer<typeof TransactionStatusResponseZod>;

export const CheckoutCourseResponseZod = z.object({
    id: z.string(),
    title: z.string(),
    image_url: z.string().nullable().optional(),
    instructor: InstructorInfoZod,
    actual_price: z.number(),
    final_price: z.number(),
    is_free: z.boolean(),
    tax_percent: z.number(),
});
export type CheckoutCourseResponse = z.infer<typeof CheckoutCourseResponseZod>;
