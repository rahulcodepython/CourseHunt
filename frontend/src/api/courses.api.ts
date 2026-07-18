"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { useSimpleMutation, usePaginatedMutation, removeFromPaginated } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { CreateCourseRequestZod, UpdateCourseRequestZod, CourseStudyResponseZod, CourseLandingResponseZod, CoursePublicResponseZod, EnrolledCourseResponseZod, CourseCreatedResponseZod, CourseInspectResponseZod } from "@/types/courses.types";
import { PaginatedResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useCoursesQuery() {
	return useAppQuery(queryKeys.courses(), () =>
		apiRequest({ url: "/api/v1/courses", method: "GET" }, PaginatedResponseZod(CoursePublicResponseZod)),
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
