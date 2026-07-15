"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
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
			invalidateKeys: [queryKeys.courses(), queryKeys.coursesInspect(), queryKeys.coursesTutor()],
			successMessage: "Course created successfully",
		},
	);
}

export function useUpdateCourseMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof UpdateCourseRequestZod> }) =>
			apiRequest({ url: `/api/v1/courses/${id}`, method: "PATCH", data }, CourseCreatedResponseZod),
		{
			invalidateKeys: [queryKeys.courses(), queryKeys.coursesInspect(), queryKeys.coursesTutor()],
			successMessage: "Course updated successfully",
		},
	);
}

export function useDeleteCourseMutation() {
	return useApiMutation(
		(id: string) => apiRequest({ url: `/api/v1/courses/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidateKeys: [queryKeys.courses(), queryKeys.coursesInspect(), queryKeys.coursesTutor()],
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
