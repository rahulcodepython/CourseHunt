"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/generics";
import {
	CreateQuizRequestZod, NextQuestionRequestZod,
	SubmitQuizRequestZod, CreateQuestionRequestZod, NextQuestionResponseZod,
	SubmitQuizResponseZod, QuizAttemptZod
} from "@/types/quiz.types";



/**
 * Creates a new quiz for a lesson.
 */
export function useCreateQuizMutation(lessonId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateQuizRequestZod>) =>
			apiRequest({ url: `/api/v1/quiz/lesson/${lessonId}`, method: "POST", data }, z.any()),
		{
			successMessage: "Quiz created successfully",
		},
	);
}

/**
 * Fetches a question in a quiz attempt.
 */
export function useGetQuestionMutation(lessonId: string, quizId: string) {
	return useApiMutation(
		(data: z.infer<typeof NextQuestionRequestZod>) =>
			apiRequest({ url: `/api/v1/quiz/lesson/${lessonId}/quiz/${quizId}/question`, method: "POST", data }, NextQuestionResponseZod),
	);
}

/**
 * Submits a quiz attempt.
 */
export function useSubmitQuizMutation(lessonId: string, quizId: string) {
	return useApiMutation(
		(data: z.infer<typeof SubmitQuizRequestZod>) =>
			apiRequest({ url: `/api/v1/quiz/lesson/${lessonId}/quiz/${quizId}/submit`, method: "POST", data }, SubmitQuizResponseZod),
		{
			successMessage: "Quiz submitted",
		},
	);
}

/**
 * Deletes a question from a quiz.
 */
export function useDeleteQuestionMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/quiz/questions/${id}`, method: "DELETE" }, z.any()),
		{
			successMessage: "Question deleted successfully",
		},
	);
}

/**
 * Creates a question for a quiz.
 */
export function useCreateQuestionMutation(quizId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateQuestionRequestZod>) =>
			apiRequest({ url: `/api/v1/quiz/${quizId}/questions`, method: "POST", data }, z.any()),
		{
			successMessage: "Question created successfully",
		},
	);
}
