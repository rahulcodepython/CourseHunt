"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
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
			invalidateKeys: [queryKeys.coupons()],
			successMessage: "Coupon created successfully",
		},
	);
}

export function useUpdateCouponMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateCouponRequestZod> }) =>
			apiRequest({ url: `/api/v1/coupons/${id}`, method: "PATCH", data }, CouponZod),
		{
			invalidateKeys: [queryKeys.coupons()],
			successMessage: "Coupon updated successfully",
		},
	);
}

export function useDeleteCouponMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/coupons/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidateKeys: [queryKeys.coupons()],
			successMessage: "Coupon deleted successfully",
		},
	);
}
