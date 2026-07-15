"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { CouponZod, CreateCouponRequestZod, UpdateCouponRequestZod, CouponCheckResponseZod } from "@/types/coupons.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useCouponsQuery() {
	return useApiQuery(queryKeys.coupons(), () =>
		apiRequest({ url: "/api/v1/coupons", method: "GET" }, PaginatedResponseZod(CouponZod)),
	);
}

export function useCheckCouponQuery(code: string) {
	return useApiQuery(queryKeys.couponCheck(), () =>
		apiRequest({ url: `/api/v1/coupons/check?code=${code}`, method: "GET" }, CouponCheckResponseZod),
	);
}

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

export function useDeleteCouponMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/coupons/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.coupons(),
				updater: cache.remove((item: any, id) => item.id === id, "data"),
			},
			successMessage: "Coupon deleted successfully",
		},
	);
}
