"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutations";
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
  return useQuery({ queryKey: queryKeys.assignments(courseId, scope), queryFn: () =>
    request(
      { url: `${API_ENDPOINTS.ASSIGNMENTS}/course/${courseId}`, method: "GET" },
      z.array(AssignmentZod),
    ) });
}

export function useAssignmentSubmissionsQuery(assignmentId: string) {
  return useQuery({ queryKey: queryKeys.assignmentSubmissions(assignmentId), queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.TUTOR_ASSIGNMENTS}/${assignmentId}/submissions`, method: "GET" },
        z.array(AssignmentSubmissionZod),
      ), enabled: Boolean(assignmentId) });
}

export function useCreateAssignmentMutation(courseId: string) {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateAssignmentRequestZod>) =>
      request(
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
      request(
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
      request(
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
