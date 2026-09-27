"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import {
  CreateQuizRequestZod,
  NextQuestionRequestZod,
  SubmitQuizRequestZod,
  CreateQuestionRequestZod,
  NextQuestionResponseZod,
  SubmitQuizResponseZod,
  QuizMetadataZod,
  QuizQuestionZod,
  QuizQuestionDetailZod,
  QuizAttemptSummaryZod,
  QuizAttemptDetailZod,
} from "@/schema/quiz.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useQuizMetadataQuery(lessonId: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_QUIZ : API_ENDPOINTS.TUTOR_QUIZ;
  return useQuery({ queryKey: queryKeys.quizMetadata(lessonId, scope), queryFn: () =>
      request(
        { url: `${endpoint}/metadata`, method: "GET", params: { lesson_id: lessonId } },
        QuizMetadataZod,
      ), enabled: !!lessonId });
}

export function useQuizQuestionsQuery(quizId: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_QUIZ : API_ENDPOINTS.TUTOR_QUIZ;
  return useQuery({ queryKey: queryKeys.quizQuestions(quizId, scope), queryFn: () =>
    request(
      { url: `${endpoint}/questions`, method: "GET", params: { quiz_id: quizId } },
      z.array(QuizQuestionDetailZod),
    ) });
}

export function useCreateQuizMutation() {
  return useSimpleMutation({
    mutationFn: ({
      lessonId,
      data,
    }: {
      lessonId: string;
      data: z.infer<typeof CreateQuizRequestZod>;
    }) =>
      request(
        { url: `${API_ENDPOINTS.TUTOR_QUIZ}/metadata`, method: "POST", params: { lesson_id: lessonId }, data },
        QuizMetadataZod,
      ),
    invalidateKeys: (_data, vars) => [
      queryKeys.lessonContent(vars.lessonId, "tutor"),
      queryKeys.lessonContent(vars.lessonId, "admin"),
      queryKeys.quizMetadata(vars.lessonId, "tutor"),
      queryKeys.quizMetadata(vars.lessonId, "admin"),
    ],
    showToast: true,
  });
}

export function useCreateQuestionMutation() {
  return useSimpleMutation({
    mutationFn: ({
      quizId,
      data,
    }: {
      quizId: string;
      data: z.infer<typeof CreateQuestionRequestZod>;
    }) =>
      request(
        { url: `${API_ENDPOINTS.TUTOR_QUIZ}/questions`, method: "POST", params: { quiz_id: quizId }, data },
        QuizQuestionZod,
      ),
    invalidateKeys: (_data, vars) => [
      queryKeys.quizQuestions(vars.quizId, "tutor"),
      queryKeys.quizQuestions(vars.quizId, "admin"),
    ],
    showToast: true,
  });
}

export function useUpdateQuestionMutation() {
  return useSimpleMutation({
    mutationFn: ({
      quizId,
      questionId,
      data,
    }: {
      quizId: string;
      questionId: string;
      data: z.infer<typeof CreateQuestionRequestZod>;
    }) =>
      request(
        { url: `${API_ENDPOINTS.TUTOR_QUIZ}/questions/${questionId}`, method: "PATCH", data },
        QuizQuestionZod,
      ),
    invalidateKeys: (_data, vars) => [
      queryKeys.quizQuestions(vars.quizId, "tutor"),
      queryKeys.quizQuestions(vars.quizId, "admin"),
    ],
    showToast: true,
  });
}

export function useDeleteQuestionMutation() {
  return useSimpleMutation({
    mutationFn: ({ quizId, questionId }: { quizId: string; questionId: string }) =>
      request(
        { url: `${API_ENDPOINTS.TUTOR_QUIZ}/questions/${questionId}`, method: "DELETE" },
        DeleteResponseZod,
      ),
    invalidateKeys: (_data, vars) => [
      queryKeys.quizQuestions(vars.quizId, "tutor"),
      queryKeys.quizQuestions(vars.quizId, "admin"),
    ],
    showToast: true,
  });
}

export function useGetQuestionMutation() {
  return useSimpleMutation({
    mutationFn: ({
      quizId,
      data,
    }: {
      quizId: string;
      data: z.infer<typeof NextQuestionRequestZod>;
    }) =>
      request(
        { url: `${API_ENDPOINTS.QUIZ}/question`, method: "POST", params: { quiz_id: quizId }, data },
        NextQuestionResponseZod,
      ),
    showToast: false,
  });
}

export function useSubmitQuizMutation() {
  return useSimpleMutation({
    mutationFn: ({
      quizId,
      data,
    }: {
      quizId: string;
      data: z.infer<typeof SubmitQuizRequestZod>;
    }) =>
      request(
        { url: `${API_ENDPOINTS.QUIZ}/submit`, method: "POST", params: { quiz_id: quizId }, data },
        SubmitQuizResponseZod,
      ),
    invalidateKeys: (_data, vars) => [queryKeys.quizAttempts(vars.quizId)],
    showToast: true,
  });
}

export function useQuizAttemptsQuery(quizId: string) {
  return useQuery({ queryKey: queryKeys.quizAttempts(quizId), queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.QUIZ}/attempts`, method: "GET", params: { quiz_id: quizId } },
        z.array(QuizAttemptSummaryZod),
      ), enabled: !!quizId });
}

export function useQuizAttemptDetailQuery(attemptId: string) {
  return useQuery({ queryKey: queryKeys.quizAttemptDetail(attemptId), queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.QUIZ}/attempts/${attemptId}`, method: "GET" },
        QuizAttemptDetailZod,
      ), enabled: !!attemptId });
}
