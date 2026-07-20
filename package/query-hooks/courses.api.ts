"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation, usePaginatedMutation, removeFromPaginated } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { CreateCourseRequestZod, UpdateCourseRequestZod, CourseStudyResponseZod, CourseLandingResponseZod, CoursePublicResponseZod, EnrolledCourseResponseZod, CourseCreatedResponseZod, CourseInspectResponseZod } from "@/package/schema/courses.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/package/schema/common.types";

export function useCoursesQuery(params?: { page?: number; limit?: number; search?: string; category_id?: string; subcategory_id?: string; level?: string }) {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set("page", params.page.toString());
	if (params?.limit) searchParams.set("limit", params.limit.toString());
	if (params?.search) searchParams.set("search", params.search);
	if (params?.category_id) searchParams.set("category_id", params.category_id);
	if (params?.subcategory_id) searchParams.set("subcategory_id", params.subcategory_id);
	if (params?.level) searchParams.set("level", params.level);
	const qs = searchParams.toString();
	const url = qs ? `/api/v1/courses?${qs}` : "/api/v1/courses";
	return useAppQuery(queryKeys.courses(params), () =>
		apiRequest({ url, method: "GET" }, PaginatedResponseZod(CoursePublicResponseZod)),
	);
}

export function useCourseStudyQuery(id: string) {
	return useAppQuery(queryKeys.courseStudy(id), () =>
		apiRequest({ url: `/api/v1/courses/${id}/study`, method: "GET" }, CourseStudyResponseZod),
	);
}

export function useCourseLandingQuery(slug: string) {
	return useAppQuery(queryKeys.courseLanding(slug), () =>
		apiRequest({ url: `/api/v1/courses/${slug}`, method: "GET" }, CourseLandingResponseZod),
	);
}

export function useEnrolledCoursesQuery() {
	return useAppQuery(queryKeys.coursesEnrolled(), () =>
		apiRequest({ url: "/api/v1/courses/enrolled", method: "GET" }, PaginatedResponseZod(EnrolledCourseResponseZod)),
	);
}

export function useCreateCourseMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof CreateCourseRequestZod>) =>
			apiRequest({ url: "/api/v1/courses", method: "POST", data }, CourseCreatedResponseZod),
		invalidateKeys: [queryKeys.courses(), queryKeys.coursesInspect(), queryKeys.coursesTutor()],
		showToast: true,
	});
}

export function useUpdateCourseMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCourseRequestZod> }) =>
			apiRequest({ url: `/api/v1/courses/${id}`, method: "PATCH", data }, CourseCreatedResponseZod),
		invalidateKeys: [queryKeys.courses(), queryKeys.coursesInspect(), queryKeys.coursesTutor()],
		showToast: true,
	});
}

export function useDeleteCourseMutation() {
	return usePaginatedMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/courses/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.courses(),
		invalidateKeys: [queryKeys.coursesInspect(), queryKeys.coursesTutor()],
		updater: (res) => removeFromPaginated(res.id),
		optimistic: (id) => removeFromPaginated(id),
		showToast: true,
	});
}

export function useInspectCoursesQuery() {
	return useAppQuery(queryKeys.coursesInspect(), () =>
		apiRequest({ url: "/api/v1/courses/inspect", method: "GET" }, PaginatedResponseZod(CourseInspectResponseZod)),
	);
}

export function useTutorCoursesQuery() {
	return useAppQuery(queryKeys.coursesTutor(), () =>
		apiRequest({ url: "/api/v1/courses", method: "GET" }, PaginatedResponseZod(CourseInspectResponseZod)),
	);
}
