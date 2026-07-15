"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { FeedbackZod, CreateFeedbackRequestZod, PinFeedbackRequestZod } from "@/types/feedbacks.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useFeedbacksQuery() {
	return useApiQuery(queryKeys.feedbacks(), () =>
		apiRequest({ url: "/api/v1/feedbacks", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}

export function usePinnedFeedbacksQuery() {
	return useApiQuery(queryKeys.feedbacksPinned(), () =>
		apiRequest({ url: "/api/v1/feedbacks/pinned", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}

export function useCreateFeedbackMutation() {
	return useApiMutation(
		(data: z.infer<typeof CreateFeedbackRequestZod>) =>
			apiRequest({ url: "/api/v1/feedbacks", method: "POST", data }, FeedbackZod),
		{
			successMessage: "Feedback submitted successfully",
		},
	);
}

export function useUpdateFeedbackMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof PinFeedbackRequestZod> }) =>
			apiRequest({ url: `/api/v1/feedbacks/${id}`, method: "PATCH", data }, FeedbackZod),
		{
			updateCache: {
				queryKey: queryKeys.feedbacks(),
				updater: cache.update((item: any, variables: any) => item.id === variables.id, "data"),
			},
			successMessage: "Feedback updated successfully",
		},
	);
}

export function useDeleteFeedbackMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/feedbacks/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.feedbacks(),
				updater: cache.remove((item: any, id) => item.id === id, "data"),
			},
			successMessage: "Feedback deleted successfully",
		},
	);
}

export function useInspectFeedbacksQuery() {
	return useApiQuery(queryKeys.feedbacksInspect(), () =>
		apiRequest({ url: "/api/v1/feedbacks/inspect", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}
