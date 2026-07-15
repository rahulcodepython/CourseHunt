"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import {
	CreateQuizRequestZod, NextQuestionRequestZod,
	SubmitQuizRequestZod, CreateQuestionRequestZod, NextQuestionResponseZod,
	SubmitQuizResponseZod, QuizMetadataZod, QuizQuestionZod
} from "@/types/quiz.types";
import { DeleteResponseZod } from "@/types/common.types";
import { queryKeys } from "@/api/query-keys";

export function useCreateQuizMutation() {
	return useApiMutation(
		({ lessonId, data }: { lessonId: string; data: z.infer<typeof CreateQuizRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/metadata?lesson_id=${lessonId}`, method: "POST", data }, QuizMetadataZod),
		{
			invalidateKeys: (data, vars) => [queryKeys.lessonContent(vars.lessonId)],
			successMessage: "Quiz created successfully",
		},
	);
}

export function useCreateQuestionMutation() {
	return useApiMutation(
		({ quizId, data }: { quizId: string; data: z.infer<typeof CreateQuestionRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/questions?quiz_id=${quizId}`, method: "POST", data }, QuizQuestionZod),
		{
			successMessage: "Question created successfully",
		},
	);
}

export function useDeleteQuestionMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/quiz/questions/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			successMessage: "Question deleted successfully",
		},
	);
}

export function useGetQuestionMutation() {
	return useApiMutation(
		({ quizId, data }: { quizId: string; data: z.infer<typeof NextQuestionRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/question?quiz_id=${quizId}`, method: "POST", data }, NextQuestionResponseZod),
	);
}

export function useSubmitQuizMutation() {
	return useApiMutation(
		({ quizId, data }: { quizId: string; data: z.infer<typeof SubmitQuizRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/submit?quiz_id=${quizId}`, method: "POST", data }, SubmitQuizResponseZod),
		{
			successMessage: "Quiz submitted",
		},
	);
}
