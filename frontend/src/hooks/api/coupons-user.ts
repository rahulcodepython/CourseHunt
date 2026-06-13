"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation } from "./generics";

// =============================================================================
// Schemas
// =============================================================================

const CouponSchema = z.object({
	id: z.number(),
	_id: z.number(),
	code: z.string(),
	expiryDate: z.string(),
	usage: z.number(),
	maxUsage: z.number(),
	offerValue: z.number(),
	isActive: z.boolean(),
	description: z.string(),
});

const CheckCouponResponseSchema = z.object({
	applied: z.boolean(),
	message: z.string(),
	coupon: CouponSchema.optional(),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Checks if a coupon code is valid for a given course.
 */
export function useCheckCouponMutation() {
	const mutation = useApiMutation((data: { code: string }) =>
		apiRequest(
			{
				url: "/api/v1/public/coupons/check",
				method: "POST",
				data: data,
			},
			CheckCouponResponseSchema,
		),
	);

	return {
		...mutation,
		checkCoupon: (code: string) => mutation.execute({ code }),
	};
}
