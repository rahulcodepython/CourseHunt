"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { DiscussionZod, CreateDiscussionRequestZod, UpdateDiscussionRequestZod } from "@/package/schema/discussions.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/package/schema/common.types";

// --- Student Hooks ---

export function useStudentDiscussionsQuery(lessonId: string, page: number = 1, limit: number = 10) {
	return useAppQuery([...queryKeys.discussions(lessonId), page, limit], () =>
		apiRequest({ url: `/api/v1/discussions/student/${lessonId}?page=${page}&limit=${limit}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useStudentDiscussionRepliesQuery(id: string, page: number = 1, limit: number = 10) {
	return useAppQuery([...queryKeys.discussionReplies(id), page, limit], () =>
		apiRequest({ url: `/api/v1/discussions/student/replies/${id}?page=${page}&limit=${limit}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useStudentCreateDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof CreateDiscussionRequestZod>) =>
			apiRequest({ url: "/api/v1/discussions/student", method: "POST", data }, DiscussionZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}

export function useStudentUpdateDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateDiscussionRequestZod> }) =>
			apiRequest({ url: `/api/v1/discussions/student/${id}`, method: "PATCH", data }, DiscussionZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}

export function useStudentDeleteDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/discussions/student/${id}`, method: "DELETE" }, DeleteResponseZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}

// --- Tutor Hooks ---

export function useTutorDiscussionsQuery(lessonId: string, page: number = 1, limit: number = 10) {
	return useAppQuery([...queryKeys.discussions(lessonId), page, limit], () =>
		apiRequest({ url: `/api/v1/discussions/tutor/${lessonId}?page=${page}&limit=${limit}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useTutorDiscussionRepliesQuery(id: string, page: number = 1, limit: number = 10) {
	return useAppQuery([...queryKeys.discussionReplies(id), page, limit], () =>
		apiRequest({ url: `/api/v1/discussions/tutor/replies/${id}?page=${page}&limit=${limit}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useTutorCreateDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof CreateDiscussionRequestZod>) =>
			apiRequest({ url: "/api/v1/discussions/tutor", method: "POST", data }, DiscussionZod),
		invalidateKeys: [["discussions"]],
		showToast: true,
	});
}

export function useTutorUpdateDiscussionMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateDiscussionRequestZod> }) =>
			apiRequest({ url: `/api/v1/discussions/tutor/${id}`, method: "PATCH", data }, DiscussionZod),
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

// --- Admin Hooks ---

export function useAdminDiscussionsQuery(lessonId: string = "", page: number = 1, limit: number = 10) {
	return useAppQuery([...queryKeys.discussionsAdmin(), lessonId, page, limit], () =>
		apiRequest({ url: `/api/v1/discussions/admin/${lessonId}?page=${page}&limit=${limit}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
	);
}

export function useAdminDiscussionRepliesQuery(id: string, page: number = 1, limit: number = 10) {
	return useAppQuery([...queryKeys.discussionReplies(id), page, limit], () =>
		apiRequest({ url: `/api/v1/discussions/admin/replies/${id}?page=${page}&limit=${limit}`, method: "GET" }, PaginatedResponseZod(DiscussionZod)),
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
