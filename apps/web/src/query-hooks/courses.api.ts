"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation, usePaginatedMutation, removeFromPaginated } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import { CreateCourseRequestZod, UpdateCourseRequestZod, CourseStudyResponseZod, CourseLandingResponseZod, CoursePublicResponseZod, EnrolledCourseResponseZod, CourseZod } from "@/schema/courses.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/schema/common.types";

export function useCoursesQuery(params?: { page?: number; limit?: number; search?: string; category_id?: string; level?: string }) {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set("page", params.page.toString());
	if (params?.limit) searchParams.set("limit", params.limit.toString());
	if (params?.search) searchParams.set("search", params.search);
	if (params?.category_id) searchParams.set("category_id", params.category_id);
	if (params?.level) searchParams.set("level", params.level);
	const qs = searchParams.toString();
	const url = qs ? `${API_ENDPOINTS.COURSES}?${qs}` : API_ENDPOINTS.COURSES;
	return useAppQuery(queryKeys.courses(params), () =>
		apiRequest({ url, method: "GET" }, PaginatedResponseZod(CoursePublicResponseZod)),
	);
}

export function useCourseStudyQuery(id: string) {
	return useAppQuery(
		queryKeys.courseStudy(id),
		() => apiRequest({ url: `${API_ENDPOINTS.COURSES}/${id}/study`, method: "GET" }, CourseStudyResponseZod),
		{ staleTime: 1000 * 60 * 5 },
	);
}

export function useCourseLandingQuery(slug: string) {
	return useAppQuery(queryKeys.courseLanding(slug), () =>
		apiRequest({ url: `${API_ENDPOINTS.COURSES}/course/${slug}`, method: "GET" }, CourseLandingResponseZod),
	);
}

export function useManageCourseQuery(id: string) {
	return useAppQuery(queryKeys.courseById(id), () =>
		apiRequest({ url: `${API_ENDPOINTS.COURSES}/${id}`, method: "GET" }, CourseZod),
	);
}

export function useEnrolledCoursesQuery() {
	return useAppQuery(queryKeys.coursesEnrolled(), () =>
		apiRequest({ url: API_ENDPOINTS.COURSES_ENROLLED, method: "GET" }, PaginatedResponseZod(EnrolledCourseResponseZod)),
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

export function useManageCoursesQuery(params?: { page?: number; limit?: number; search?: string; category_id?: string; level?: string; tutor_id?: string; status?: string }) {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set("page", params.page.toString());
	if (params?.limit) searchParams.set("limit", params.limit.toString());
	if (params?.search) searchParams.set("search", params.search);
	if (params?.category_id) searchParams.set("category_id", params.category_id);
	if (params?.level) searchParams.set("level", params.level);
	if (params?.tutor_id) searchParams.set("tutor_id", params.tutor_id);
	if (params?.status) searchParams.set("status", params.status);
	const qs = searchParams.toString();
	const url = qs ? `${API_ENDPOINTS.COURSES_MANAGE}?${qs}` : API_ENDPOINTS.COURSES_MANAGE;
	return useAppQuery(queryKeys.coursesManage(params), () =>
		apiRequest({ url, method: "GET" }, PaginatedResponseZod(CourseZod)),
	);
}

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
