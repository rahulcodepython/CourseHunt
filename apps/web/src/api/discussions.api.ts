"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { useSimpleMutation } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { DiscussionZod, CreateDiscussionRequestZod, UpdateDiscussionRequestZod } from "@/types/discussions.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useDiscussionsQuery(lessonId: string) {
	return useAppQuery(queryKeys.discussions(lessonId), () =>
		apiRequest({ url: `/api/v1/discussions?lessonID=${lessonId}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useCreateDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof CreateDiscussionRequestZod>) =>
			apiRequest({ url: "/api/v1/discussions", method: "POST", data }, DiscussionZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}

export function useDiscussionRepliesQuery(id: string) {
	return useAppQuery(queryKeys.discussionReplies(id), () =>
		apiRequest({ url: `/api/v1/discussions/replies/${id}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useDeleteDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/discussions/${id}`, method: "DELETE" }, DeleteResponseZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}

export function useUpdateDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateDiscussionRequestZod> }) =>
			apiRequest({ url: `/api/v1/discussions/${id}`, method: "PATCH", data }, DiscussionZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}

export function useTutorDeleteDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/discussions/tutor/${id}`, method: "DELETE" }, DeleteResponseZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}

export function useAdminDiscussionsQuery() {
	return useAppQuery(queryKeys.discussionsAdmin(), () =>
		apiRequest({ url: "/api/v1/discussions/admin", method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useAdminDeleteDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/discussions/admin/${id}`, method: "DELETE" }, DeleteResponseZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}
