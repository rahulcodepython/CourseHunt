import { z } from "zod";
import {
  UserInfoZod,
  CourseInfoZod,
  CouponInfoZod,
  InstructorInfoZod,
} from "@/schema/common.types";

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

export const RefundUserZod = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});
export type RefundUser = z.infer<typeof RefundUserZod>;

export const RefundTransactionZod = z.object({
  id: z.string(),
  transaction_id: z.string(),
  duplicate_of: z.string().nullable().optional(),
  user: RefundUserZod,
  course: CourseInfoZod,
  amount: z.number(),
  currency: z.string(),
  reason: z.string(),
  refund_status: z.string(),
  razorpay_refund_id: z.string().nullable().optional(),
  razorpay_payment_id: z.string().nullable().optional(),
  error_description: z.string().nullable().optional(),
  created_at: z.string(),
  refunded_at: z.string().nullable().optional(),
});
export type RefundTransaction = z.infer<typeof RefundTransactionZod>;

export const TutorPayoutTransactionZod = z.object({
  id: z.string(),
  transaction_id: z.string(),
  tutor_id: z.string(),
  course_id: z.string(),
  course_title: z.string(),
  gross_amount: z.number(),
  platform_fee_percent: z.number(),
  platform_fee_amount: z.number(),
  net_payout_amount: z.number(),
  currency: z.string(),
  payout_status: z.string(),
  requested_at: z.string().nullable().optional(),
  settled_at: z.string().nullable().optional(),
  payout_reference: z.string().nullable().optional(),
  created_at: z.string(),
});
export type TutorPayoutTransaction = z.infer<typeof TutorPayoutTransactionZod>;

export const TutorPayoutSummaryZod = z.object({
  total_gross_earnings: z.number(),
  total_platform_fees: z.number(),
  total_net_earnings: z.number(),
  pending_payout_amount: z.number(),
  settled_payout_amount: z.number(),
  requested_payout_amount: z.number(),
});
export type TutorPayoutSummary = z.infer<typeof TutorPayoutSummaryZod>;

export const TutorPayoutOverviewZod = z.object({
  summary: TutorPayoutSummaryZod,
  history: z.array(TutorPayoutTransactionZod),
});
export type TutorPayoutOverview = z.infer<typeof TutorPayoutOverviewZod>;

export const SettlePayoutRequestZod = z.object({
  payout_reference: z.string().min(1, "Payout reference is required"),
});
export type SettlePayoutRequest = z.infer<typeof SettlePayoutRequestZod>;

