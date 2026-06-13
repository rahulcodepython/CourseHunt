"use client";

import { Coupon } from "@/types/coupon.type";
import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation, useApiQuery } from "./generics";
import { queryKeys } from "./query-keys";

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

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches all coupons for admin.
 */
export function useAdminCouponsQuery() {
	return useApiQuery(queryKeys.adminCoupons(), () =>
		apiRequest(
			{
				url: "/api/v1/coupons",
				method: "GET",
			},
			z.array(CouponSchema),
		),
	);
}

/**
 * Creates a new coupon.
 */
export function useCreateCouponMutation() {
	const mutation = useApiMutation(
		(data: Omit<Coupon, "_id" | "usage">) =>
			apiRequest(
				{
					url: "/api/v1/coupons/create",
					method: "POST",
					data: data,
				},
				z.object({ coupon: CouponSchema }),
			),
		{
			invalidateKeys: [queryKeys.adminCoupons()],
		},
	);

	return {
		...mutation,
		createCoupon: mutation.execute,
	};
}

/**
 * Deletes a coupon by ID.
 */
export function useDeleteCouponMutation() {
	const mutation = useApiMutation(
		(id: string) =>
			apiRequest({
				url: `/api/v1/coupons/edit/${id}`,
				method: "DELETE",
			}),
		{
			invalidateKeys: [queryKeys.adminCoupons()],
		},
	);

	return {
		...mutation,
		deleteCoupon: mutation.execute,
	};
}

/**
 * Updates an existing coupon.
 */
export function useUpdateCouponMutation() {
	const mutation = useApiMutation(
		({ id, data }: { id: string; data: Partial<Omit<Coupon, "_id" | "usage">> }) =>
			apiRequest(
				{
					url: `/api/v1/coupons/edit/${id}`,
					method: "PATCH",
					data: data,
				},
				z.object({ coupon: CouponSchema }),
			),
		{
			invalidateKeys: [queryKeys.adminCoupons()],
		},
	);

	return {
		...mutation,
		updateCoupon: mutation.execute,
	};
}
