"use client";

import { CourseType } from "@/types/course.type";
import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation, useApiQuery } from "./generics";
import { queryKeys } from "./query-keys";

// =============================================================================
// Schemas
// =============================================================================

const MediaSchema = z.object({
	url: z.string(),
	fileType: z.string(),
});

const CourseSummarySchema = z.object({
	id: z.number(),
	_id: z.number(),
	creatorId: z.string(),
	title: z.string(),
	description: z.string(),
	duration: z.string(),
	students: z.number(),
	rating: z.number(),
	reviews: z.number(),
	price: z.number(),
	originalPrice: z.number(),
	category: z.string(),
	discount: z.string(),
	totalRevenue: z.number().optional(),
	imageUrl: MediaSchema,
	createdAt: z.string().optional(),
});

const LessonSchema = z.object({
	id: z.number(),
	_id: z.number(),
	chapter_id: z.number().optional(),
	title: z.string(),
	duration: z.string(),
	type: z.string(),
	videoUrl: MediaSchema,
	content: z.string(),
	order_index: z.number().optional(),
});

const ChapterSchema = z.object({
	id: z.number(),
	_id: z.number(),
	course_id: z.number().optional(),
	title: z.string(),
	preview: z.boolean(),
	order_index: z.number().optional(),
	totallessons: z.number(),
	lessons: z.array(LessonSchema),
});

const FAQSchema = z.object({
	id: z.number().optional(),
	question: z.string(),
	answer: z.string(),
});

const ResourceSchema = z.object({
	id: z.number().optional(),
	title: z.string(),
	fileUrl: MediaSchema,
});

const CourseDetailSchema = z.object({
	id: z.number(),
	_id: z.number(),
	creatorId: z.string(),
	title: z.string(),
	description: z.string(),
	duration: z.string(),
	students: z.number(),
	rating: z.number(),
	reviews: z.number(),
	price: z.number(),
	originalPrice: z.number(),
	category: z.string(),
	category_id: z.number(),
	discount: z.string(),
	totalRevenue: z.number(),
	imageUrl: MediaSchema,
	previewVideoUrl: MediaSchema,
	longDescription: z.string(),
	whatYouWillLearn: z.array(z.string()),
	prerequisites: z.array(z.string()),
	requirements: z.array(z.string()),
	chapters: z.array(ChapterSchema),
	chaptersCount: z.number(),
	lessonsCount: z.number(),
	isPublished: z.boolean(),
	faq: z.array(FAQSchema),
	resources: z.array(ResourceSchema),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches all courses for admin.
 */
export function useAdminCoursesQuery() {
	return useApiQuery(queryKeys.adminCourses(), () =>
		apiRequest(
			{
				url: "/api/v1/courses/admin",
				method: "GET",
			},
			z.array(CourseSummarySchema),
		),
	);
}

/**
 * Fetches a single course for admin editing.
 */
export function useAdminCourseSingleQuery(id: string) {
	return useApiQuery(
		queryKeys.adminCourseSingle(id),
		() =>
			apiRequest(
				{
					url: `/api/v1/courses/admin/edit/${id}`,
					method: "GET",
				},
				CourseDetailSchema,
			),
		{ enabled: !!id },
	);
}

/**
 * Creates a new course.
 */
export function useCreateCourseMutation() {
	const mutation = useApiMutation(
		(data: { title: string }) =>
			apiRequest(
				{
					url: "/api/v1/courses/admin/create",
					method: "POST",
					data: data,
				},
				z.object({ course: CourseDetailSchema }),
			),
		{
			invalidateKeys: [queryKeys.adminCourses()],
		},
	);

	return {
		...mutation,
		createCourse: mutation.execute,
	};
}

/**
 * Deletes a course.
 */
export function useDeleteCourseMutation() {
	const mutation = useApiMutation(
		(id: string) =>
			apiRequest({
				url: `/api/v1/courses/admin/edit/${id}`,
				method: "DELETE",
			}),
		{
			invalidateKeys: [queryKeys.adminCourses()],
		},
	);

	return {
		...mutation,
		deleteCourse: mutation.execute,
	};
}

/**
 * Updates an existing course.
 */
export function useUpdateCourseMutation() {
	const mutation = useApiMutation(
		({ id, data }: { id: string; data: Partial<CourseType> }) =>
			apiRequest(
				{
					url: `/api/v1/courses/admin/edit/${id}`,
					method: "PATCH",
					data: data,
				},
				CourseDetailSchema,
			),
		{
			invalidateKeys: [queryKeys.adminCourses()],
		},
	);

	return {
		...mutation,
		updateCourse: mutation.execute,
	};
}
