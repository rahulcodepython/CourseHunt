"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import {
  useSimpleMutation,
  usePaginatedMutation,
  appendToPaginated,
  removeFromPaginated,
} from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import { WishlistItemZod } from "@/schema/wishlist.types";
import { SuccessResponseZod, DeleteResponseZod, PaginatedResponseZod } from "@/schema/common.types";

import { createListQuery } from "@/react-query/factory";

export const useWishlistQuery = createListQuery(
  API_ENDPOINTS.WISHLIST,
  queryKeys.wishlist,
  WishlistItemZod,
);

export function useAddCourseToWishlistMutation() {
  return usePaginatedMutation({
    mutationFn: (courseId: string) =>
      apiRequest(
        { url: API_ENDPOINTS.WISHLIST, method: "POST", data: { course_id: courseId } },
        WishlistItemZod,
      ),
    queryKey: queryKeys.wishlist(),
    updater: (item) => appendToPaginated(item),
    showToast: true,
  });
}

export function useRemoveCourseFromWishlistMutation() {
  return usePaginatedMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${API_ENDPOINTS.WISHLIST}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.wishlist(),
    updater: (res) => removeFromPaginated(res.id),
    optimistic: (id) => removeFromPaginated(id),
    showToast: true,
  });
}

export function useClearWishlistMutation() {
  return useSimpleMutation({
    mutationFn: () =>
      apiRequest({ url: API_ENDPOINTS.WISHLIST, method: "DELETE" }, SuccessResponseZod),
    invalidateKeys: [queryKeys.wishlist()],
    showToast: true,
  });
}
