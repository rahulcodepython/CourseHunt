"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { usePaginatedMutation, prependToPaginated, replaceInPaginated, removeFromPaginated } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import { CouponZod, CreateCouponRequestZod, UpdateCouponRequestZod, CouponCheckResponseZod } from "@/schema/coupons.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

export function useCouponsQuery() {
	return useAppQuery(queryKeys.coupons(), () =>
		apiRequest({ url: API_ENDPOINTS.COUPONS, method: "GET" }, PaginatedResponseZod(CouponZod)),
	);
}

export function useCheckCouponQuery(code: string, courseId: string, enabled: boolean) {
	return useAppQuery(
		queryKeys.couponCheck(code, courseId),
		() => apiRequest({ url: `${API_ENDPOINTS.COUPONS}/check?code=${encodeURIComponent(code)}&course_id=${courseId}`, method: "GET" }, CouponCheckResponseZod),
		{ enabled },
	);
}

export function useCreateCouponMutation() {
	return usePaginatedMutation({
		mutationFn: (data: z.infer<typeof CreateCouponRequestZod>) =>
			apiRequest({ url: API_ENDPOINTS.COUPONS, method: "POST", data }, CouponZod),
		queryKey: queryKeys.coupons(),
		updater: (coupon) => prependToPaginated(coupon),
		showToast: true,
	});
}

export function useUpdateCouponMutation() {
	return usePaginatedMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCouponRequestZod> }) =>
			apiRequest({ url: `${API_ENDPOINTS.COUPONS}/${id}`, method: "PATCH", data }, CouponZod),
		queryKey: queryKeys.coupons(),
		updater: (coupon) => replaceInPaginated(coupon),
		showToast: true,
	});
}

export function useDeleteCouponMutation() {
	return usePaginatedMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `${API_ENDPOINTS.COUPONS}/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.coupons(),
		updater: (res) => removeFromPaginated(res.id),
		optimistic: (id) => removeFromPaginated(id),
		showToast: true,
	});
}
