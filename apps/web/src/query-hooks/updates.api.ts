"use client";

import { apiRequest, compactParams } from "@/react-query/client";
import { z } from "zod";

import {
  usePaginatedMutation,
  prependToPaginated,
  replaceInPaginated,
  removeFromPaginated,
} from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import {
  CourseUpdateZod,
  CreateUpdateRequestZod,
  UpdateUpdateRequestZod,
  UpdateFeedResponseZod,
} from "@/schema/updates.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

export function useUpdatesQuery() {
  return useAppQuery(queryKeys.updates(), () =>
    apiRequest(
      { url: API_ENDPOINTS.UPDATES, method: "GET" },
      PaginatedResponseZod(CourseUpdateZod),
    ),
  );
}

export function useUpdateFeedQuery(params?: { page?: number; limit?: number }) {
  return useAppQuery(queryKeys.updateFeed(params), () =>
    apiRequest(
      { url: API_ENDPOINTS.UPDATES_FEED, method: "GET", params: compactParams(params) },
      UpdateFeedResponseZod,
    ),
  );
}

export function useCreateUpdateMutation() {
  return usePaginatedMutation({
    mutationFn: (data: z.infer<typeof CreateUpdateRequestZod>) =>
      apiRequest({ url: API_ENDPOINTS.UPDATES, method: "POST", data }, CourseUpdateZod),
    queryKey: queryKeys.updates(),
    updater: (update) => prependToPaginated(update),
    invalidateKeys: [queryKeys.updateFeed()],
    showToast: true,
  });
}

export function useDeleteUpdateMutation() {
  return usePaginatedMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${API_ENDPOINTS.UPDATES}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.updates(),
    updater: (res) => removeFromPaginated(res.id),
    optimistic: (id) => removeFromPaginated(id),
    invalidateKeys: [queryKeys.updateFeed()],
    showToast: true,
  });
}

export function useUpdateUpdateMutation() {
  return usePaginatedMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateUpdateRequestZod> }) =>
      apiRequest({ url: `${API_ENDPOINTS.UPDATES}/${id}`, method: "PATCH", data }, CourseUpdateZod),
    queryKey: queryKeys.updates(),
    updater: (update) => replaceInPaginated(update),
    invalidateKeys: [queryKeys.updateFeed()],
    showToast: true,
  });
}
