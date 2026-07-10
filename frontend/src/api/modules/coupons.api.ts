"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { CouponZod, CreateCouponRequestZod, UpdateCouponRequestZod, CouponCheckResponseZod } from "@/types/coupons.types";
import { PaginatedResponseZod } from "@/types/common.types";

import { CouponDeleteResponseZod } from "@/types/coupons.types";

/**
 * Fetches all coupons.
 */
export function useCouponsQuery() {
	return useApiQuery(queryKeys.coupons(), () =>
		apiRequest({ url: "/api/v1/coupons", method: "GET" }, PaginatedResponseZod(CouponZod)),
	);
}

/**
 * Checks if a coupon is valid.
 */
export function useCheckCouponQuery() {
	return useApiQuery(queryKeys.couponCheck(), () =>
		apiRequest({ url: "/api/v1/coupons/check", method: "GET" }, CouponCheckResponseZod),
	);
}

/**
 * Creates a new coupon.
 * Cache strategy: prepends to the coupons list.
 */
export function useCreateCouponMutation() {
	return useApiMutation(
		(data: z.infer<typeof CreateCouponRequestZod>) =>
			apiRequest({ url: "/api/v1/coupons", method: "POST", data }, CouponZod),
		{
			updateCache: {
				queryKey: queryKeys.coupons(),
				updater: cache.prepend("data"),
			},
			successMessage: "Coupon created successfully",
		},
	);
}

/**
 * Updates a coupon.
 * Cache strategy: updates the matching coupon in the paginated list cache.
 */
export function useUpdateCouponMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateCouponRequestZod> }) =>
			apiRequest({ url: `/api/v1/coupons/${id}`, method: "PATCH", data }, CouponZod),
		{
			updateCache: {
				queryKey: queryKeys.coupons(),
				updater: cache.update((item: any, variables: any) => item.id === variables.id, "data"),
			},
			successMessage: "Coupon updated successfully",
		},
	);
}

/**
 * Deletes a coupon.
 * Cache strategy: removes the coupon from the list cache.
 */
export function useDeleteCouponMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/coupons/${id}`, method: "DELETE" }, CouponDeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.coupons(),
				updater: cache.remove((item: any, id) => item.id === id, "data"),
			},
			successMessage: "Coupon deleted successfully",
		},
	);
}
