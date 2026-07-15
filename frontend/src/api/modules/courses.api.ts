"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { CreateCourseRequestZod, UpdateCourseRequestZod, CourseStudyResponseZod, CourseLandingResponseZod, CoursePublicResponseZod, EnrolledCourseResponseZod, CourseCreatedResponseZod, CourseInspectResponseZod } from "@/types/courses.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useCoursesQuery() {
	return useApiQuery(queryKeys.courses(), () =>
		apiRequest({ url: "/api/v1/courses", method: "GET" }, PaginatedResponseZod(CoursePublicResponseZod)),
	);
}

export function useCourseStudyQuery(id: string) {
	return useApiQuery(queryKeys.courseStudy(id), () =>
		apiRequest({ url: `/api/v1/courses/${id}/study`, method: "GET" }, CourseStudyResponseZod),
	);
}

export function useCourseLandingQuery(slug: string) {
	return useApiQuery(queryKeys.courseLanding(slug), () =>
		apiRequest({ url: `/api/v1/courses/${slug}`, method: "GET" }, CourseLandingResponseZod),
	);
}

export function useEnrolledCoursesQuery() {
	return useApiQuery(queryKeys.coursesEnrolled(), () =>
		apiRequest({ url: "/api/v1/courses/enrolled", method: "GET" }, PaginatedResponseZod(EnrolledCourseResponseZod)),
	);
}

export function useCreateCourseMutation() {
	return useApiMutation(
		(data: z.infer<typeof CreateCourseRequestZod>) =>
			apiRequest({ url: "/api/v1/courses", method: "POST", data }, CourseCreatedResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.courses(),
				updater: cache.prepend("data"),
			},
			successMessage: "Course created successfully",
		},
	);
}

export function useUpdateCourseMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateCourseRequestZod> }) =>
			apiRequest({ url: `/api/v1/courses/${id}`, method: "PATCH", data }, CourseCreatedResponseZod),
		{
			updateCache: [
				{
					queryKey: queryKeys.courses(),
					updater: cache.update((item: any, variables: any) => item.id === variables.id, "data"),
				}
			],
			successMessage: "Course updated successfully",
		},
	);
}

export function useDeleteCourseMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/courses/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.courses(),
				updater: cache.remove((item: any, id) => item.id === id, "data"),
			},
			successMessage: "Course deleted successfully",
		},
	);
}

export function useInspectCoursesQuery() {
	return useApiQuery(queryKeys.coursesInspect(), () =>
		apiRequest({ url: "/api/v1/courses/inspect", method: "GET" }, PaginatedResponseZod(CourseInspectResponseZod)),
	);
}

export function useTutorCoursesQuery() {
	return useApiQuery(queryKeys.coursesTutor(), () =>
		apiRequest({ url: "/api/v1/courses", method: "GET" }, PaginatedResponseZod(CourseInspectResponseZod)),
	);
}
