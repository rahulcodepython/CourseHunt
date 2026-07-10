"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { CourseZod, CreateCourseRequestZod, UpdateCourseRequestZod, CourseStudyResponseZod, CourseLandingResponseZod, CourseCardResponseZod, EnrolledCourseResponseZod } from "@/types/courses.types";
import { PaginatedResponseZod } from "@/types/common.types";



/**
 * Fetches all paginated courses.
 */
export function useCoursesQuery() {
	return useApiQuery(queryKeys.courses(), () =>
		apiRequest({ url: "/api/v1/courses", method: "GET" }, PaginatedResponseZod(CourseCardResponseZod)),
	);
}

/**
 * Fetches course study details.
 */
export function useCourseStudyQuery(id: string) {
	return useApiQuery(queryKeys.courseStudy(id), () =>
		apiRequest({ url: `/api/v1/courses/${id}/study`, method: "GET" }, CourseStudyResponseZod),
	);
}

/**
 * Fetches course landing info by slug.
 */
export function useCourseLandingQuery(slug: string) {
	return useApiQuery(queryKeys.courseLanding(slug), () =>
		apiRequest({ url: `/api/v1/courses/${slug}`, method: "GET" }, CourseLandingResponseZod),
	);
}

/**
 * Fetches the current user's enrolled courses.
 */
export function useEnrolledCoursesQuery() {
	return useApiQuery(queryKeys.coursesEnrolled(), () =>
		apiRequest({ url: "/api/v1/enrolled", method: "GET" }, z.array(EnrolledCourseResponseZod)),
	);
}


/**
 * Creates a new course.
 * Cache strategy: prepend to courses list.
 */
export function useCreateCourseMutation() {
	return useApiMutation(
		(data: z.infer<typeof CreateCourseRequestZod>) =>
			apiRequest({ url: "/api/v1/courses", method: "POST", data }, CourseZod),
		{
			updateCache: {
				queryKey: queryKeys.courses(),
				updater: cache.prepend("data"),
			},
			successMessage: "Course created successfully",
		},
	);
}

/**
 * Updates a course.
 * Cache strategy: updates matching course in the list and invalidates detail queries.
 */
export function useUpdateCourseMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateCourseRequestZod> }) =>
			apiRequest({ url: `/api/v1/courses/${id}`, method: "PATCH", data }, CourseZod),
		{
			updateCache: [
				{
					queryKey: queryKeys.courses(),
					updater: cache.update((item: any, variables: any) => item.id === variables.id, "data"),
				}
			],
			/* invalidate detail omitted */
			successMessage: "Course updated successfully",
		},
	);
}

/**
 * Deletes a course.
 * Cache strategy: removes matching course from the list.
 */
export function useDeleteCourseMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/courses/${id}`, method: "DELETE" }, z.any()),
		{
			updateCache: {
				queryKey: queryKeys.courses(),
				updater: cache.remove((item: any, id) => item.id === id, "data"),
			},
			successMessage: "Course deleted successfully",
		},
	);
}
