"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import {
	CreateQuizRequestZod, NextQuestionRequestZod,
	SubmitQuizRequestZod, CreateQuestionRequestZod, NextQuestionResponseZod,
	SubmitQuizResponseZod, QuizMetadataZod, QuizQuestionZod, QuizQuestionDetailZod
} from "@/schema/quiz.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useQuizMetadataQuery(lessonId: string) {
	return useAppQuery(
		queryKeys.quizMetadata(lessonId),
		() => apiRequest({ url: `/api/v1/quiz/metadata?lesson_id=${lessonId}`, method: "GET" }, QuizMetadataZod),
		{ enabled: !!lessonId },
	);
}

export function useQuizQuestionsQuery(quizId: string) {
	return useAppQuery(queryKeys.quizQuestions(quizId), () =>
		apiRequest({ url: `/api/v1/quiz/questions?quiz_id=${quizId}`, method: "GET" }, z.array(QuizQuestionDetailZod)),
	);
}

export function useCreateQuizMutation() {
	return useSimpleMutation({
		mutationFn: ({ lessonId, data }: { lessonId: string; data: z.infer<typeof CreateQuizRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/metadata?lesson_id=${lessonId}`, method: "POST", data }, QuizMetadataZod),
		invalidateKeys: (_data, vars) => [queryKeys.lessonContent(vars.lessonId), queryKeys.quizMetadata(vars.lessonId)],
		showToast: true,
	});
}

export function useCreateQuestionMutation() {
	return useSimpleMutation({
		mutationFn: ({ quizId, data }: { quizId: string; data: z.infer<typeof CreateQuestionRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/questions?quiz_id=${quizId}`, method: "POST", data }, QuizQuestionZod),
		invalidateKeys: (_data, vars) => [queryKeys.quizQuestions(vars.quizId)],
		showToast: true,
	});
}

export function useUpdateQuestionMutation() {
	return useSimpleMutation({
		mutationFn: ({ quizId, questionId, data }: { quizId: string; questionId: string; data: z.infer<typeof CreateQuestionRequestZod> }) =>
			apiRequest({ url: `/api/v1/quiz/questions/${questionId}`, method: "PATCH", data }, QuizQuestionZod),
		invalidateKeys: (_data, vars) => [queryKeys.quizQuestions(vars.quizId)],
		showToast: true,
	});
}

export function useDeleteQuestionMutation() {
	return useSimpleMutation({
		mutationFn: ({ quizId, questionId }: { quizId: string; questionId: string }) =>
			apiRequest({ url: `/api/v1/quiz/questions/${questionId}`, method: "DELETE" }, DeleteResponseZod),
		invalidateKeys: (_data, vars) => [queryKeys.quizQuestions(vars.quizId)],
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
