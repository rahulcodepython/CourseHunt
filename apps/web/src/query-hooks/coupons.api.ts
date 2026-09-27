"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";
import { z } from "zod";

import {
  usePaginatedMutation,
  prependToPaginated,
  replaceInPaginated,
  removeFromPaginated,
} from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import {
  CouponZod,
  CreateCouponRequestZod,
  UpdateCouponRequestZod,
  CouponCheckResponseZod,
} from "@/schema/coupons.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

function getCouponEndpoint(scope: "admin" | "tutor") {
  return scope === "admin" ? API_ENDPOINTS.ADMIN_COUPONS : API_ENDPOINTS.TUTOR_COUPONS;
}

export function useCouponsQuery(scope: "admin" | "tutor" = "admin") {
  return useQuery({ queryKey: queryKeys.coupons(scope), queryFn: () =>
    request({ url: getCouponEndpoint(scope), method: "GET" }, PaginatedResponseZod(CouponZod)) });
}

export function useCheckCouponQuery(code: string, courseId: string, enabled: boolean) {
  return useQuery({ queryKey: queryKeys.couponCheck(code, courseId), queryFn: () =>
      request(
        {
          url: API_ENDPOINTS.COUPONS_CHECK,
          method: "GET",
          params: { code, course_id: courseId },
        },
        CouponCheckResponseZod,
      ), enabled });
}

export function useCreateCouponMutation(scope: "admin" | "tutor" = "admin") {
  return usePaginatedMutation({
    mutationFn: (data: z.infer<typeof CreateCouponRequestZod>) =>
      request({ url: getCouponEndpoint(scope), method: "POST", data }, CouponZod),
    queryKey: queryKeys.coupons(scope),
    updater: (coupon) => prependToPaginated(coupon),
    showToast: true,
  });
}

export function useUpdateCouponMutation(scope: "admin" | "tutor" = "admin") {
  return usePaginatedMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCouponRequestZod> }) =>
      request({ url: `${getCouponEndpoint(scope)}/${id}`, method: "PATCH", data }, CouponZod),
    queryKey: queryKeys.coupons(scope),
    updater: (coupon) => replaceInPaginated(coupon),
    showToast: true,
  });
}

export function useDeleteCouponMutation(scope: "admin" | "tutor" = "admin") {
  return usePaginatedMutation({
    mutationFn: (id: string) =>
      request({ url: `${getCouponEndpoint(scope)}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.coupons(scope),
    updater: (res) => removeFromPaginated(res.id),
    optimistic: (id) => removeFromPaginated(id),
    showToast: true,
  });
}
