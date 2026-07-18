"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation, usePaginatedMutation, removeFromPaginated } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { FeedbackZod, CreateFeedbackRequestZod, PinFeedbackRequestZod } from "@/package/schema/feedbacks.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/package/schema/common.types";

const feedbackKeys = [queryKeys.feedbacks(), queryKeys.feedbacksPinned(), queryKeys.feedbacksInspect()];

export function useFeedbacksQuery() {
	return useAppQuery(queryKeys.feedbacks(), () =>
		apiRequest({ url: "/api/v1/feedbacks", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}

export function usePinnedFeedbacksQuery() {
	return useAppQuery(queryKeys.feedbacksPinned(), () =>
		apiRequest({ url: "/api/v1/feedbacks/pinned", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}

export function useCreateFeedbackMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof CreateFeedbackRequestZod>) =>
			apiRequest({ url: "/api/v1/feedbacks", method: "POST", data }, FeedbackZod),
		invalidateKeys: feedbackKeys,
		showToast: true,
	});
}

export function useUpdateFeedbackMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof PinFeedbackRequestZod> }) =>
			apiRequest({ url: `/api/v1/feedbacks/${id}`, method: "PATCH", data }, FeedbackZod),
		invalidateKeys: feedbackKeys,
		showToast: true,
	});
}

export function useDeleteFeedbackMutation() {
	return usePaginatedMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/feedbacks/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.feedbacks(),
		invalidateKeys: [queryKeys.feedbacksPinned(), queryKeys.feedbacksInspect()],
		updater: (res) => removeFromPaginated(res.id),
		optimistic: (id) => removeFromPaginated(id),
		showToast: true,
	});
}

export function useInspectFeedbacksQuery() {
	return useAppQuery(queryKeys.feedbacksInspect(), () =>
		apiRequest({ url: "/api/v1/feedbacks/inspect", method: "GET" }, PaginatedResponseZod(FeedbackZod)),
	);
}
