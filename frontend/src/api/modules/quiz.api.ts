"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/generics";
import {
	CreateQuizRequestZod, StartQuizAttemptRequestZod, NextQuestionRequestZod,
	SubmitQuizRequestZod, CreateQuestionRequestZod, NextQuestionResponseZod,
	SubmitQuizResponseZod, QuizAttemptZod
} from "@/types/quiz.types";

import { QuizDeleteQuestionResponseZod } from "@/types/quiz.types";
import { QuizQuestionResponseZod } from "@/types/quiz.types";
import { QuizResponseZod } from "@/types/quiz.types";

/**
 * Creates a new quiz for a lesson.
 */
export function useCreateQuizMutation(lessonId: string) {
	return useApiMutation(
		(data: z.infer<typeof CreateQuizRequestZod>) =>
			apiRequest({ url: `/api/v1/quiz/lesson/${lessonId}`, method: "POST", data }, QuizResponseZod),
		{
			successMessage: "Quiz created successfully",
		},
	);
}

/**
 * Fetches the next question in a quiz attempt.
 */
export function useNextQuestionMutation(lessonId: string) {
	return useApiMutation(
		(data: z.infer<typeof NextQuestionRequestZod>) =>
			apiRequest({ url: `/api/v1/quiz/lesson/${lessonId}/next`, method: "POST", data }, NextQuestionResponseZod),
	);
}

/**
 * Starts a quiz attempt.
 */
export function useStartQuizMutation(lessonId: string) {
	return useApiMutation(
		(data: z.infer<typeof StartQuizAttemptRequestZod>) =>
			apiRequest({ url: `/api/v1/quiz/lesson/${lessonId}/start`, method: "POST", data }, QuizAttemptZod),
		{
			successMessage: "Quiz started",
		},
	);
}

/**
 * Submits a quiz attempt.
 */
export function useSubmitQuizMutation(lessonId: string) {
	return useApiMutation(
		(data: z.infer<typeof SubmitQuizRequestZod>) =>
			apiRequest({ url: `/api/v1/quiz/lesson/${lessonId}/submit`, method: "POST", data }, SubmitQuizResponseZod),
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
		(id: string) => apiRequest({ url: `/api/v1/quiz/questions/${id}`, method: "DELETE" }, QuizDeleteQuestionResponseZod),
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
			apiRequest({ url: `/api/v1/quiz/${quizId}/questions`, method: "POST", data }, QuizQuestionResponseZod),
		{
			successMessage: "Question created successfully",
		},
	);
}
