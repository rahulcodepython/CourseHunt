"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import {
  AssignmentZod,
  AssignmentSubmissionZod,
  CreateAssignmentRequestZod,
  SubmitAssignmentRequestZod,
  GradeAssignmentRequestZod,
} from "@/schema/assignments.types";

export function useAssignmentsQuery(courseId: string, scope?: string) {
  return useAppQuery(queryKeys.assignments(courseId, scope), () =>
    apiRequest(
      { url: `${API_ENDPOINTS.ASSIGNMENTS}/course/${courseId}`, method: "GET" },
      z.array(AssignmentZod),
    ),
  );
}

export function useAssignmentSubmissionsQuery(assignmentId: string) {
  return useAppQuery(
    queryKeys.assignmentSubmissions(assignmentId),
    () =>
      apiRequest(
        { url: `${API_ENDPOINTS.TUTOR_ASSIGNMENTS}/${assignmentId}/submissions`, method: "GET" },
        z.array(AssignmentSubmissionZod),
      ),
    { enabled: Boolean(assignmentId) },
  );
}

export function useCreateAssignmentMutation(courseId: string) {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateAssignmentRequestZod>) =>
      apiRequest(
        { url: API_ENDPOINTS.TUTOR_ASSIGNMENTS, method: "POST", data },
        AssignmentZod,
      ),
    invalidateKeys: [queryKeys.assignments(courseId)],
    showToast: true,
  });
}

export function useSubmitAssignmentMutation(assignmentId: string, courseId: string) {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof SubmitAssignmentRequestZod>) =>
      apiRequest(
        { url: `${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/submit`, method: "POST", data },
        AssignmentSubmissionZod,
      ),
    invalidateKeys: [
      queryKeys.assignments(courseId),
      queryKeys.myAssignmentSubmission(assignmentId),
    ],
    showToast: true,
  });
}

export function useGradeAssignmentMutation(assignmentId: string) {
  return useSimpleMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: z.infer<typeof GradeAssignmentRequestZod>;
    }) =>
      apiRequest(
        {
          url: `${API_ENDPOINTS.TUTOR_ASSIGNMENTS}/submissions/${submissionId}/grade`,
          method: "POST",
          data,
        },
        AssignmentSubmissionZod,
      ),
    invalidateKeys: [queryKeys.assignmentSubmissions(assignmentId)],
    showToast: true,
  });
}
