"use client";

import { apiRequest } from "@package/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@package/react-query/mutation";
import { queryKeys } from "@package/react-query/query-keys";
import {
	CreateQuizRequestZod, NextQuestionRequestZod,
	SubmitQuizRequestZod, CreateQuestionRequestZod, NextQuestionResponseZod,
	SubmitQuizResponseZod, QuizMetadataZod, QuizQuestionZod
} from "@package/schema/quiz.types";
import { DeleteResponseZod } from "@package/schema/common.types";

export function useCreateQuizMutation() {
	return useSimpleMutation({
		mutationFn: ({ lessonId, data }: { lessonId: string; data: z.infer<typeof CreateQuizRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/metadata?lesson_id=${lessonId}`, method: "POST", data }, QuizMetadataZod),
		invalidateKeys: (_data, vars) => [queryKeys.lessonContent(vars.lessonId)],
		showToast: true,
	});
}

export function useCreateQuestionMutation() {
	return useSimpleMutation({
		mutationFn: ({ quizId, data }: { quizId: string; data: z.infer<typeof CreateQuestionRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/questions?quiz_id=${quizId}`, method: "POST", data }, QuizQuestionZod),
		showToast: true,
	});
}

export function useDeleteQuestionMutation() {
	return useSimpleMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/quiz/questions/${id}`, method: "DELETE" }, DeleteResponseZod),
		showToast: true,
	});
}

export function useGetQuestionMutation() {
	return useSimpleMutation({
		mutationFn: ({ quizId, data }: { quizId: string; data: z.infer<typeof NextQuestionRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/question?quiz_id=${quizId}`, method: "POST", data }, NextQuestionResponseZod),
	});
}

export function useSubmitQuizMutation() {
	return useSimpleMutation({
		mutationFn: ({ quizId, data }: { quizId: string; data: z.infer<typeof SubmitQuizRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/submit?quiz_id=${quizId}`, method: "POST", data }, SubmitQuizResponseZod),
		showToast: true,
	});
}
