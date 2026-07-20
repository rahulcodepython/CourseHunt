"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { DiscussionZod, CreateDiscussionRequestZod, UpdateDiscussionRequestZod } from "@/package/schema/discussions.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/package/schema/common.types";

export function useDiscussionsQuery(lessonId: string, page: number = 1, limit: number = 10) {
	return useAppQuery([...queryKeys.discussions(lessonId), page, limit], () =>
		apiRequest({ url: `/api/v1/discussions?lessonID=${lessonId}&page=${page}&limit=${limit}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
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

export function useDiscussionRepliesQuery(id: string, page: number = 1, limit: number = 10) {
	return useAppQuery([...queryKeys.discussionReplies(id), page, limit], () =>
		apiRequest({ url: `/api/v1/discussions/replies/${id}?page=${page}&limit=${limit}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
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
