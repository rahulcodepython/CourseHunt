"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
import { ChapterZod, CreateChapterRequestZod, UpdateChapterRequestZod } from "@/types/chapters.types";
import { DeleteResponseZod } from "@/types/common.types";

export function useChaptersQuery(courseId: string) {
	return useApiQuery(queryKeys.chapters(courseId), () =>
		apiRequest({ url: `/api/v1/chapters?course_id=${courseId}`, method: "GET" }, z.array(ChapterZod)),
	);
}

export function useCreateChapterMutation(courseId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateChapterRequestZod>) =>
			apiRequest({ url: `/api/v1/chapters?course_id=${courseId}`, method: "POST", data }, ChapterZod),
		{
			invalidateKeys: [queryKeys.chapters(courseId)],
			successMessage: "Chapter created successfully",
		},
	);
}

export function useUpdateChapterMutation(courseId: string) {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateChapterRequestZod> }) =>
			apiRequest({ url: `/api/v1/chapters/${id}`, method: "PATCH", data }, ChapterZod),
		{
			invalidateKeys: [queryKeys.chapters(courseId)],
			successMessage: "Chapter updated successfully",
		},
	);
}

export function useDeleteChapterMutation(courseId: string) {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/chapters/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidateKeys: [queryKeys.chapters(courseId)],
			successMessage: "Chapter deleted successfully",
		},
	);
}
