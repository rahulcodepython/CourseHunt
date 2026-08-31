"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import {
  useSimpleMutation,
} from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { createListQuery } from "@/react-query/query-factories";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import {
  CreateCourseRequestZod,
  UpdateCourseRequestZod,
  CourseStudyResponseZod,
  CourseLandingResponseZod,
  CoursePublicResponseZod,
  EnrolledCourseResponseZod,
  CourseZod,
} from "@/schema/courses.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

export const useCoursesQuery = createListQuery<
  z.infer<typeof CoursePublicResponseZod>,
  { page?: number; limit?: number; search?: string; category_id?: string; level?: string }
>(API_ENDPOINTS.COURSES, queryKeys.courses, CoursePublicResponseZod);

export function useCourseStudyQuery(id: string) {
  return useAppQuery(
    queryKeys.courseStudy(id),
    () =>
      apiRequest(
        { url: `${API_ENDPOINTS.COURSES}/${id}/study`, method: "GET" },
        CourseStudyResponseZod,
      ),
    { staleTime: 1000 * 60 * 5 },
  );
}

export function useCourseLandingQuery(slug: string) {
  return useAppQuery(queryKeys.courseLanding(slug), () =>
    apiRequest(
      { url: `${API_ENDPOINTS.COURSES}/course/${slug}`, method: "GET" },
      CourseLandingResponseZod,
    ),
  );
}

export function useManageCoursesQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  level?: string;
  tutor_id?: string;
  status?: string;
  scope?: "admin" | "tutor";
}) {
  const scope = params?.scope ?? "admin";
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_COURSES : API_ENDPOINTS.TUTOR_COURSES;
  const keyBuilder = scope === "admin" ? queryKeys.coursesAdmin : queryKeys.coursesTutor;

  return useAppQuery(keyBuilder(params as Record<string, string | number>), () =>
    apiRequest({ url: endpoint, method: "GET", params }, PaginatedResponseZod(CourseZod)),
  );
}

export function useManageCourseQuery(id: string, scope: "admin" | "tutor" = "tutor") {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_COURSES : API_ENDPOINTS.TUTOR_COURSES;
  return useAppQuery(queryKeys.courseById(id, scope), () =>
    apiRequest({ url: `${endpoint}/${id}`, method: "GET" }, CourseZod),
  );
}

export function useEnrolledCoursesQuery() {
  return useAppQuery(queryKeys.coursesEnrolled(), () =>
    apiRequest(
      { url: API_ENDPOINTS.COURSES_ENROLLED, method: "GET" },
      PaginatedResponseZod(EnrolledCourseResponseZod),
    ),
  );
}

export function useEnrollFreeMutation() {
  return useSimpleMutation({
    mutationFn: (courseId: string) =>
      apiRequest({ url: `${API_ENDPOINTS.COURSES}/${courseId}/enroll`, method: "POST" }, z.null()),
    invalidateKeys: [queryKeys.coursesEnrolled(), queryKeys.transactions()],
    showToast: true,
  });
}

export function useCreateCourseMutation() {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateCourseRequestZod>) =>
      apiRequest({ url: API_ENDPOINTS.TUTOR_COURSES, method: "POST", data }, CourseZod),
    invalidateKeys: [queryKeys.courses(), queryKeys.coursesTutor()],
    showToast: true,
  });
}

export function useUpdateCourseMutation() {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCourseRequestZod> }) =>
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_COURSES}/${id}`, method: "PATCH", data }, CourseZod),
    invalidateKeys: (_data, vars) => [
      queryKeys.courseById(vars.id, "tutor"),
      queryKeys.courseById(vars.id, "admin"),
      queryKeys.courses(),
      queryKeys.coursesTutor(),
    ],
    showToast: true,
  });
}

export function useDeleteCourseMutation() {
  return useSimpleMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${API_ENDPOINTS.TUTOR_COURSES}/${id}`, method: "DELETE" }, DeleteResponseZod),
    invalidateKeys: [queryKeys.courses(), queryKeys.coursesTutor()],
    showToast: true,
  });
}
