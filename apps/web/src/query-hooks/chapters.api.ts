"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useArrayMutation, appendToArray, replaceInArray, removeFromArray } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { ChapterZod, CreateChapterRequestZod, UpdateChapterRequestZod } from "@/schema/chapters.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useChaptersQuery(courseId: string) {
	return useAppQuery(queryKeys.chapters(courseId), () =>
		apiRequest({ url: `/api/v1/chapters?course_id=${courseId}`, method: "GET" }, z.array(ChapterZod)),
	);
}

export function useCreateChapterMutation(courseId: string) {
	return useArrayMutation({
		mutationFn: (data: z.infer<typeof CreateChapterRequestZod>) =>
			apiRequest({ url: `/api/v1/chapters?course_id=${courseId}`, method: "POST", data }, ChapterZod),
		queryKey: queryKeys.chapters(courseId),
		updater: (ch) => appendToArray(ch),
		showToast: true,
	});
}

export function useUpdateChapterMutation(courseId: string) {
	return useArrayMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateChapterRequestZod> }) =>
			apiRequest({ url: `/api/v1/chapters/${id}`, method: "PATCH", data }, ChapterZod),
		queryKey: queryKeys.chapters(courseId),
		updater: (ch) => replaceInArray(ch),
		showToast: true,
	});
}

export function useDeleteChapterMutation(courseId: string) {
	return useArrayMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/chapters/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.chapters(courseId),
		updater: (res) => removeFromArray(res.id),
		optimistic: (id) => removeFromArray(id),
		showToast: true,
	});
}


