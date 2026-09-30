"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { request, compactParams } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import {
  CreateCourseRequestZod,
  UpdateCourseRequestZod,
  CourseStudyResponseZod,
  CourseLandingResponseZod,
  CoursePublicResponseZod,
  EnrolledCourseResponseZod,
  CourseZod,
  AdminCourseItemZod,
  AdminCourseDetailZod,
  CourseOptionZod,
  CourseSummaryZod,
  CourseAnalyticsResponseZod,
} from "@/schema/courses.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

export function useCoursesQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  level?: string;
}) {
  return useQuery({
    queryKey: queryKeys.courses(params as Record<string, string | number>),
    queryFn: () =>
      request(
        { url: API_ENDPOINTS.COURSES, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(CoursePublicResponseZod),
      ),
  });
}

export function useInfiniteCoursesQuery(params?: {
  limit?: number;
  search?: string;
  category_id?: string;
  level?: string;
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.courses(params as Record<string, string | number>),
    queryFn: ({ pageParam = 1 }) =>
      request(
        {
          url: API_ENDPOINTS.COURSES,
          method: "GET",
          params: compactParams({
            ...params,
            page: pageParam,
            limit: params?.limit ?? 12,
          }),
        },
        PaginatedResponseZod(CoursePublicResponseZod),
      ),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function useCourseStudyQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.courseStudy(id),
    queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.COURSES}/${id}/study`, method: "GET" },
        CourseStudyResponseZod,
      ),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCourseLandingQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.courseLanding(slug),
    queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.COURSES}/course/${slug}`, method: "GET" },
        CourseLandingResponseZod,
      ),
  });
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

  return useQuery({
    queryKey: keyBuilder(params as Record<string, string | number>),
    queryFn: () =>
      request({ url: endpoint, method: "GET", params: compactParams(params) }, PaginatedResponseZod(CourseZod)),
  });
}

export function useInfiniteAdminCoursesQuery(params?: {
  limit?: number;
  search?: string;
  category_id?: string;
  level?: string;
  tutor_id?: string;
  status?: string;
}) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.coursesAdmin(params as Record<string, string | number>), "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      request(
        {
          url: API_ENDPOINTS.ADMIN_COURSES,
          method: "GET",
          params: compactParams({
            ...params,
            page: pageParam,
            limit: params?.limit ?? 10,
          }),
        },
        PaginatedResponseZod(AdminCourseItemZod),
      ),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function useInfiniteManageCoursesQuery(params?: {
  limit?: number;
  search?: string;
  category_id?: string;
  level?: string;
  tutor_id?: string;
  status?: string;
  scope?: "admin" | "tutor";
}) {
  const scope = params?.scope ?? "tutor";
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_COURSES : API_ENDPOINTS.TUTOR_COURSES;
  const keyBuilder = scope === "admin" ? queryKeys.coursesAdmin : queryKeys.coursesTutor;

  return useInfiniteQuery({
    queryKey: [...keyBuilder(params as Record<string, string | number>), "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      request(
        {
          url: endpoint,
          method: "GET",
          params: compactParams({
            ...params,
            page: pageParam,
            limit: params?.limit ?? 10,
          }),
        },
        PaginatedResponseZod(CourseZod),
      ),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function useManageCourseQuery(
  id: string,
  scope: "admin" | "tutor" = "tutor",
  options?: { enabled?: boolean },
) {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_COURSES : API_ENDPOINTS.TUTOR_COURSES;
  const schema = scope === "admin" ? AdminCourseDetailZod : CourseZod;
  return useQuery({
    queryKey: queryKeys.courseById(id, scope),
    queryFn: () => request({ url: `${endpoint}/${id}`, method: "GET" }, schema),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useCourseOptionsQuery(scope: "admin" | "tutor" = "admin", options?: { enabled?: boolean }) {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_COURSES_OPTIONS : API_ENDPOINTS.TUTOR_COURSES_OPTIONS;
  return useQuery({
    queryKey: queryKeys.courseOptions(scope),
    queryFn: () => request({ url: endpoint, method: "GET" }, z.array(CourseOptionZod)),
    enabled: options?.enabled ?? true,
  });
}

export function useCourseSummaryQuery(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.courseSummary(courseId),
    queryFn: () => request({ url: `${API_ENDPOINTS.COURSES}/${courseId}/summary`, method: "GET" }, CourseSummaryZod),
    enabled: Boolean(courseId) && (options?.enabled ?? true),
  });
}

export function useCourseAnalyticsQuery(
  courseId: string,
  scope: "admin" | "tutor" = "admin",
  options?: { enabled?: boolean },
) {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_COURSES : API_ENDPOINTS.TUTOR_COURSES;
  return useQuery({
    queryKey: queryKeys.courseAnalytics(courseId, scope),
    queryFn: () =>
      request(
        { url: `${endpoint}/${courseId}/analytics`, method: "GET" },
        CourseAnalyticsResponseZod,
      ),
    enabled: Boolean(courseId) && (options?.enabled ?? true),
  });
}

export function useEnrolledCoursesQuery() {
  return useQuery({
    queryKey: queryKeys.coursesEnrolled(),
    queryFn: () =>
      request(
        { url: API_ENDPOINTS.COURSES_ENROLLED, method: "GET" },
        PaginatedResponseZod(EnrolledCourseResponseZod),
      ),
  });
}

export function useInfiniteEnrolledCoursesQuery(params?: { limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.coursesEnrolled(), "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      request(
        {
          url: API_ENDPOINTS.COURSES_ENROLLED,
          method: "GET",
          params: compactParams({
            ...params,
            page: pageParam,
            limit: params?.limit ?? 10,
          }),
        },
        PaginatedResponseZod(EnrolledCourseResponseZod),
      ),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function useEnrollFreeMutation() {
  return useSimpleMutation({
    mutationFn: (courseId: string) =>
      request({ url: `${API_ENDPOINTS.COURSES}/${courseId}/enroll`, method: "POST" }, z.null()),
    invalidateKeys: [queryKeys.coursesEnrolled(), queryKeys.transactions()],
  });
}

export function useCreateCourseMutation() {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateCourseRequestZod>) =>
      request({ url: API_ENDPOINTS.TUTOR_COURSES, method: "POST", data }, CourseZod),
    invalidateKeys: [queryKeys.courses(), queryKeys.coursesTutor()],
  });
}

export function useUpdateCourseMutation() {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCourseRequestZod> }) =>
      request({ url: `${API_ENDPOINTS.TUTOR_COURSES}/${id}`, method: "PATCH", data }, CourseZod),
    invalidateKeys: (_data, vars) => [
      queryKeys.courseById(vars.id, "tutor"),
      queryKeys.courseById(vars.id, "admin"),
      queryKeys.courses(),
      queryKeys.coursesTutor(),
    ],
  });
}

export function useDeleteCourseMutation() {
  return useSimpleMutation({
    mutationFn: (id: string) =>
      request({ url: `${API_ENDPOINTS.TUTOR_COURSES}/${id}`, method: "DELETE" }, DeleteResponseZod),
    invalidateKeys: [queryKeys.courses(), queryKeys.coursesTutor()],
  });
}
