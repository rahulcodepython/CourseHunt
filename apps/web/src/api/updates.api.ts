"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { usePaginatedMutation, prependToPaginated, replaceInPaginated, removeFromPaginated } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { CourseUpdateZod, CreateUpdateRequestZod, UpdateUpdateRequestZod, UpdateFeedResponseZod } from "@/types/updates.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useUpdatesQuery() {
	return useAppQuery(queryKeys.updates(), () =>
		apiRequest({ url: "/api/v1/updates", method: "GET" }, PaginatedResponseZod(CourseUpdateZod)),
	);
}

export function useUpdateFeedQuery() {
	return useAppQuery(queryKeys.updateFeed(), () =>
		apiRequest({ url: "/api/v1/updates/feed", method: "GET" }, UpdateFeedResponseZod),
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
