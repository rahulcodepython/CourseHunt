"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useArrayMutation, appendToArray, replaceInArray, removeFromArray } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { FaqZod, CreateFaqRequestZod, UpdateFaqRequestZod } from "@/schema/faqs.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useFaqsQuery(courseId: string) {
	return useAppQuery(
		queryKeys.faqs(courseId),
		() => apiRequest({ url: `/api/v1/faqs?course_id=${courseId}`, method: "GET" }, z.array(FaqZod)),
		{ enabled: !!courseId },
	);
}

// Unauthenticated — used by the public course detail page.
export function usePublicFaqsQuery(courseId: string) {
	return useAppQuery(
		queryKeys.faqsPublic(courseId),
		() => apiRequest({ url: `/api/v1/faqs/public?course_id=${courseId}`, method: "GET" }, z.array(FaqZod)),
		{ enabled: !!courseId },
	);
}

export function useCreateFaqMutation(courseId: string) {
	return useArrayMutation({
		mutationFn: (data: z.infer<typeof CreateFaqRequestZod>) =>
			apiRequest({ url: `/api/v1/faqs?course_id=${courseId}`, method: "POST", data }, FaqZod),
		queryKey: queryKeys.faqs(courseId),
		updater: (faq) => appendToArray(faq),
		invalidateKeys: [queryKeys.faqs(courseId)],
		showToast: true,
	});
}

export function useUpdateFaqMutation(courseId: string) {
	return useArrayMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateFaqRequestZod> }) =>
			apiRequest({ url: `/api/v1/faqs/${id}`, method: "PATCH", data }, FaqZod),
		queryKey: queryKeys.faqs(courseId),
		updater: (faq) => replaceInArray(faq),
		invalidateKeys: [queryKeys.faqs(courseId)],
		showToast: true,
	});
}

export function useDeleteFaqMutation(courseId: string) {
	return useArrayMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/faqs/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.faqs(courseId),
		updater: (res) => removeFromArray(res.id),
		optimistic: (id) => removeFromArray(id),
		invalidateKeys: [queryKeys.faqs(courseId)],
		showToast: true,
	});
}
