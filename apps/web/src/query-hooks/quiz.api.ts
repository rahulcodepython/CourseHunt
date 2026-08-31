"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
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
  return useAppQuery(
    queryKeys.quizMetadata(lessonId, scope),
    () =>
      apiRequest(
        { url: `${endpoint}/metadata?lesson_id=${lessonId}`, method: "GET" },
        QuizMetadataZod,
      ),
    { enabled: !!lessonId },
  );
}

export function useQuizQuestionsQuery(quizId: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_QUIZ : API_ENDPOINTS.TUTOR_QUIZ;
  return useAppQuery(queryKeys.quizQuestions(quizId, scope), () =>
    apiRequest(
      { url: `${endpoint}/questions?quiz_id=${quizId}`, method: "GET" },
      z.array(QuizQuestionDetailZod),
    ),
  );
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
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_QUIZ}/metadata?lesson_id=${lessonId}`, method: "POST", data },
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
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_QUIZ}/questions?quiz_id=${quizId}`, method: "POST", data },
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
      apiRequest(
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
      apiRequest(
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
      apiRequest(
        { url: `${API_ENDPOINTS.QUIZ}/question?quiz_id=${quizId}`, method: "POST", data },
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
      apiRequest(
        { url: `${API_ENDPOINTS.QUIZ}/submit?quiz_id=${quizId}`, method: "POST", data },
        SubmitQuizResponseZod,
      ),
    invalidateKeys: (_data, vars) => [queryKeys.quizAttempts(vars.quizId)],
    showToast: true,
  });
}

export function useQuizAttemptsQuery(quizId: string) {
  return useAppQuery(
    queryKeys.quizAttempts(quizId),
    () =>
      apiRequest(
        { url: `${API_ENDPOINTS.QUIZ}/attempts?quiz_id=${quizId}`, method: "GET" },
        z.array(QuizAttemptSummaryZod),
      ),
    { enabled: !!quizId },
  );
}

export function useQuizAttemptDetailQuery(attemptId: string) {
  return useAppQuery(
    queryKeys.quizAttemptDetail(attemptId),
    () =>
      apiRequest(
        { url: `${API_ENDPOINTS.QUIZ}/attempts/${attemptId}`, method: "GET" },
        QuizAttemptDetailZod,
      ),
    { enabled: !!attemptId },
  );
}
