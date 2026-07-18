"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { usePaginatedMutation, prependToPaginated, replaceInPaginated, removeFromPaginated } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { CouponZod, CreateCouponRequestZod, UpdateCouponRequestZod, CouponCheckResponseZod } from "@/types/coupons.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useCouponsQuery() {
	return useAppQuery(queryKeys.coupons(), () =>
		apiRequest({ url: "/api/v1/coupons", method: "GET" }, PaginatedResponseZod(CouponZod)),
	);
}

export function useCheckCouponQuery(code: string) {
	return useAppQuery(queryKeys.couponCheck(), () =>
		apiRequest({ url: `/api/v1/coupons/check?code=${code}`, method: "GET" }, CouponCheckResponseZod),
	);
}

export function useCreateCouponMutation() {
	return usePaginatedMutation({
		mutationFn: (data: z.infer<typeof CreateCouponRequestZod>) =>
			apiRequest({ url: "/api/v1/coupons", method: "POST", data }, CouponZod),
		queryKey: queryKeys.coupons(),
		updater: (coupon) => prependToPaginated(coupon),
		showToast: true,
	});
}

export function useUpdateCouponMutation() {
	return usePaginatedMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCouponRequestZod> }) =>
			apiRequest({ url: `/api/v1/coupons/${id}`, method: "PATCH", data }, CouponZod),
		queryKey: queryKeys.coupons(),
		updater: (coupon) => replaceInPaginated(coupon),
		showToast: true,
	});
}

export function useDeleteCouponMutation() {
	return usePaginatedMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/coupons/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.coupons(),
		updater: (res) => removeFromPaginated(res.id),
		optimistic: (id) => removeFromPaginated(id),
		showToast: true,
	});
}
