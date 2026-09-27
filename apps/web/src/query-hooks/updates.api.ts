"use client";

import { useQuery } from "@tanstack/react-query";
import { request, compactParams } from "@/react-query/client";
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
  CourseUpdateZod,
  CreateUpdateRequestZod,
  UpdateUpdateRequestZod,
  UpdateFeedResponseZod,
} from "@/schema/updates.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

function getUpdateEndpoint(scope: "admin" | "tutor") {
  return scope === "admin" ? API_ENDPOINTS.ADMIN_UPDATES : API_ENDPOINTS.TUTOR_UPDATES;
}

export function useUpdatesQuery(scope: "admin" | "tutor" = "admin") {
  return useQuery({ queryKey: queryKeys.updates(scope), queryFn: () =>
    request(
      { url: getUpdateEndpoint(scope), method: "GET" },
      PaginatedResponseZod(CourseUpdateZod),
    ) });
}

export function useUpdateFeedQuery(params?: { page?: number; limit?: number }) {
  return useQuery({ queryKey: queryKeys.updateFeed(params), queryFn: () =>
    request(
      { url: API_ENDPOINTS.UPDATES_FEED, method: "GET", params: compactParams(params) },
      UpdateFeedResponseZod,
    ) });
}

export function useCreateUpdateMutation(scope: "admin" | "tutor" = "admin") {
  return usePaginatedMutation({
    mutationFn: (data: z.infer<typeof CreateUpdateRequestZod>) =>
      request({ url: getUpdateEndpoint(scope), method: "POST", data }, CourseUpdateZod),
    queryKey: queryKeys.updates(scope),
    updater: (update) => prependToPaginated(update),
    invalidateKeys: [queryKeys.updateFeed(), queryKeys.updatesAll()],
    showToast: true,
  });
}

export function useDeleteUpdateMutation(scope: "admin" | "tutor" = "admin") {
  return usePaginatedMutation({
    mutationFn: (id: string) =>
      request({ url: `${getUpdateEndpoint(scope)}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.updates(scope),
    updater: (res) => removeFromPaginated(res.id),
    optimistic: (id) => removeFromPaginated(id),
    invalidateKeys: [queryKeys.updateFeed(), queryKeys.updatesAll()],
    showToast: true,
  });
}

export function useUpdateUpdateMutation(scope: "admin" | "tutor" = "admin") {
  return usePaginatedMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateUpdateRequestZod> }) =>
      request({ url: `${getUpdateEndpoint(scope)}/${id}`, method: "PATCH", data }, CourseUpdateZod),
    queryKey: queryKeys.updates(scope),
    updater: (update) => replaceInPaginated(update),
    invalidateKeys: [queryKeys.updateFeed(), queryKeys.updatesAll()],
    showToast: true,
  });
}
