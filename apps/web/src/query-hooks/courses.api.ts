"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import {
  useSimpleMutation,
  usePaginatedMutation,
  removeFromPaginated,
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

export function useManageCourseQuery(id: string) {
  return useAppQuery(queryKeys.courseById(id), () =>
    apiRequest({ url: `${API_ENDPOINTS.COURSES}/${id}`, method: "GET" }, CourseZod),
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

export const useManageCoursesQuery = createListQuery<
  z.infer<typeof CourseZod>,
  {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: string;
    level?: string;
    tutor_id?: string;
    status?: string;
  }
>(API_ENDPOINTS.COURSES_MANAGE, queryKeys.coursesManage, CourseZod);

export function useCreateCourseMutation() {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateCourseRequestZod>) =>
      apiRequest({ url: API_ENDPOINTS.COURSES, method: "POST", data }, CourseZod),
    invalidateKeys: [queryKeys.courses(), queryKeys.coursesManage()],
    showToast: true,
  });
}

export function useUpdateCourseMutation() {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCourseRequestZod> }) =>
      apiRequest({ url: `${API_ENDPOINTS.COURSES}/${id}`, method: "PATCH", data }, CourseZod),
    invalidateKeys: [queryKeys.courses(), queryKeys.coursesManage()],
    showToast: true,
  });
}

export function useDeleteCourseMutation() {
  return usePaginatedMutation({
    mutationFn: (id: string) =>
      apiRequest({ url: `${API_ENDPOINTS.COURSES}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.courses(),
    invalidateKeys: [queryKeys.coursesManage()],
    updater: (res) => removeFromPaginated(res.id),
    optimistic: (id) => removeFromPaginated(id),
    showToast: true,
  });
}
