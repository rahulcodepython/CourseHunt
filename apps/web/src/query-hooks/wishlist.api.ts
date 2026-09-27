"use client";

import { useQuery } from "@tanstack/react-query";
import { request, compactParams } from "@/react-query/client";

import {
  useSimpleMutation,
  usePaginatedMutation,
  appendToPaginated,
  removeFromPaginated,
} from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import { WishlistItemZod } from "@/schema/wishlist.types";
import { SuccessResponseZod, DeleteResponseZod, PaginatedResponseZod } from "@/schema/common.types";

export function useWishlistQuery(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: queryKeys.wishlist(),
    queryFn: () =>
      request(
        { url: API_ENDPOINTS.WISHLIST, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(WishlistItemZod),
      ),
  });
}

export function useAddCourseToWishlistMutation() {
  return usePaginatedMutation({
    mutationFn: (courseId: string) =>
      request(
        { url: API_ENDPOINTS.WISHLIST, method: "POST", data: { course_id: courseId } },
        WishlistItemZod,
      ),
    queryKey: queryKeys.wishlist(),
    updater: (item) => appendToPaginated(item),
  });
}

export function useRemoveCourseFromWishlistMutation() {
  return usePaginatedMutation({
    mutationFn: (id: string) =>
      request({ url: `${API_ENDPOINTS.WISHLIST}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.wishlist(),
    updater: (res: { id: string }) => removeFromPaginated(res.id),
  });
}

export function useClearWishlistMutation() {
  return useSimpleMutation({
    mutationFn: () =>
      request({ url: API_ENDPOINTS.WISHLIST, method: "DELETE" }, SuccessResponseZod),
    invalidateKeys: [queryKeys.wishlist()],
  });
}
