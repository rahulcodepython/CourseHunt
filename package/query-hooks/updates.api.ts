"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { usePaginatedMutation, prependToPaginated, replaceInPaginated, removeFromPaginated } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { CourseUpdateZod, CreateUpdateRequestZod, UpdateUpdateRequestZod, UpdateFeedResponseZod } from "@/package/schema/updates.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/package/schema/common.types";

export function useUpdatesQuery() {
	return useAppQuery(queryKeys.updates(), () =>
		apiRequest({ url: "/api/v1/updates", method: "GET" }, PaginatedResponseZod(CourseUpdateZod)),
	);
}

export function useUpdateFeedQuery(params?: { page?: number; limit?: number }) {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set("page", params.page.toString());
	if (params?.limit) searchParams.set("limit", params.limit.toString());
	const qs = searchParams.toString();
	const url = qs ? `/api/v1/updates/feed?${qs}` : "/api/v1/updates/feed";
	return useAppQuery(queryKeys.updateFeed(params), () =>
		apiRequest({ url, method: "GET" }, UpdateFeedResponseZod),
	);
}

export function useCreateUpdateMutation() {
	return usePaginatedMutation({
		mutationFn: (data: z.infer<typeof CreateUpdateRequestZod>) =>
			apiRequest({ url: "/api/v1/updates", method: "POST", data }, CourseUpdateZod),
		queryKey: queryKeys.updates(),
		updater: (update) => prependToPaginated(update),
		invalidateKeys: [queryKeys.updateFeed()],
		showToast: true,
	});
}

export function useDeleteUpdateMutation() {
	return usePaginatedMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/updates/${id}`, method: "DELETE" }, DeleteResponseZod),
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
			apiRequest({ url: `/api/v1/updates/${id}`, method: "PATCH", data }, CourseUpdateZod),
		queryKey: queryKeys.updates(),
		updater: (update) => replaceInPaginated(update),
		invalidateKeys: [queryKeys.updateFeed()],
		showToast: true,
	});
}
