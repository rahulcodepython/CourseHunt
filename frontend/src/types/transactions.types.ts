import { z } from 'zod';
import { CouponInfoZod, CourseInfoZod, UserInfoZod } from './common.types';

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

export const InitiateTransactionRequestZod = z.object({
    course_id: z.string(),
    coupon_code: z.string().optional(),
});
export type InitiateTransactionRequest = z.infer<typeof InitiateTransactionRequestZod>;

export const ManualEnrollRequestZod = z.object({
    user_id: z.string(),
});
export type ManualEnrollRequest = z.infer<typeof ManualEnrollRequestZod>;

export const InitiateTransactionResponseZod = z.object({
    transaction_id: z.string(),
    razorpay_order_id: z.string(),
    amount: z.number(),
    currency: z.string(),
    razorpay_key: z.string(),
});
export type InitiateTransactionResponse = z.infer<typeof InitiateTransactionResponseZod>;

export const WebhookPayloadZod = z.object({
    EventID: z.string(),
    Event: z.string(),
    OrderID: z.string(),
    PaymentID: z.string(),
    Status: z.string(),
    ErrorDescription: z.string(),
});
export type WebhookPayload = z.infer<typeof WebhookPayloadZod>;
export const TransactionZod = z.any(); export type Transaction = any;
export const InitiateTransactionRequestZod = z.any(); export type InitiateTransactionRequest = any;
export const InitiateTransactionResponseZod = z.any(); export type InitiateTransactionResponse = any;
export const WebhookRequestZod = z.any(); export type WebhookRequest = any;
