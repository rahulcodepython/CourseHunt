"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation, usePaginatedMutation, removeFromPaginated } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { FeedbackZod, CreateFeedbackRequestZod, PinFeedbackRequestZod } from "@/schema/feedbacks.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

const feedbackKeys = [queryKeys.feedbacks(), queryKeys.feedbacksPinned()];

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
		invalidateKeys: [queryKeys.feedbacksPinned()],
		updater: (res) => removeFromPaginated(res.id),
		optimistic: (id) => removeFromPaginated(id),
		showToast: true,
	});
}
