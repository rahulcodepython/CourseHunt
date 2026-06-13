"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation, useApiQuery } from "./generics";
import { queryKeys } from "./query-keys";

const DiscussionSchema = z.object({
	id: z.number(),
	lessonId: z.number(),
	userId: z.string(),
	userName: z.string(),
	message: z.string(),
	isTutorResponse: z.boolean(),
	createdAt: z.string(),
});

export function useLessonDiscussionsQuery(lessonId: number) {
	return useApiQuery(
		[...queryKeys.discussions(), lessonId.toString()],
		() =>
			apiRequest(
				{
					url: `/api/v1/discussions/lesson/${lessonId}`,
					method: "GET",
				},
				z.array(DiscussionSchema),
			),
		{ enabled: !!lessonId }
	);
}

export function useCreateDiscussionMutation() {
	return useApiMutation(
		(data: { lessonId: number; message: string; courseId: number }) =>
			apiRequest(
				{
					url: "/api/v1/discussions",
					method: "POST",
					data: data,
				},
				DiscussionSchema
			),
		{
			invalidateKeys: [queryKeys.discussions()],
			successMessage: "Message posted successfully",
		}
	);
}
