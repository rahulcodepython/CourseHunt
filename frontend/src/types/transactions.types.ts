import { z } from 'zod';
import { UserInfoZod, CourseInfoZod, CouponInfoZod } from '@/types/common.types';

// ── DB Row Structs ────────────────────────────────────────────────────────────

export const TransactionZod = z.object({
    id: z.string(),
    user: UserInfoZod,
    course: CourseInfoZod,
    coupon: CouponInfoZod,
    razorpay_order_id: z.string().optional(),
    razorpay_payment_id: z.string().optional(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    error_description: z.string().optional(),
    confirmed_at: z.string().optional(),
    created_at: z.string(),
});
export type Transaction = z.infer<typeof TransactionZod>;

export const WebhookEventZod = z.object({
    id: z.string(),
    razorpay_event_id: z.string(),
    event_type: z.string(),
    processed: z.boolean(),
    received_at: z.string(),
});
export type WebhookEvent = z.infer<typeof WebhookEventZod>;

// ── Requests ──────────────────────────────────────────────────────────────────

export const InitiateTransactionRequestZod = z.object({
    course_id: z.string(),
    coupon_code: z.string().optional(),
});
export type InitiateTransactionRequest = z.infer<typeof InitiateTransactionRequestZod>;

export const ManualEnrollRequestZod = z.object({
    user_id: z.string(),
});
export type ManualEnrollRequest = z.infer<typeof ManualEnrollRequestZod>;

// ── Responses ─────────────────────────────────────────────────────────────────

export const InitiateTransactionResponseZod = z.object({
    transaction_id: z.string(),
    razorpay_order_id: z.string(),
    amount: z.number(),
    currency: z.string(),
    razorpay_key: z.string(),
});
export type InitiateTransactionResponse = z.infer<typeof InitiateTransactionResponseZod>;

// Note: WebhookPayload has no JSON tags in the Go struct. 
// Assuming standard snake_case mapping for the Zod schema to keep consistency.
export const WebhookPayloadZod = z.object({
    event_id: z.string(),
    event: z.string(),
    order_id: z.string(),
    payment_id: z.string(),
    status: z.string(),
    error_description: z.string(),
});
export type WebhookPayload = z.infer<typeof WebhookPayloadZod>;