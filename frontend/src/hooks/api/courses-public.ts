"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiQuery } from "./generics";
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

const CategoryResponseSchema = z.object({
	_id: z.string(),
	name: z.string(),
});

const UserCourseSchema = z.object({
	_id: z.number(),
	title: z.string(),
	totalLessons: z.number(),
	completedLessons: z.number(),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches all public courses.
 */
export function usePublicCoursesQuery() {
	return useApiQuery(queryKeys.courses(), () =>
		apiRequest(
			{
				url: "/api/v1/public/courses",
				method: "GET",
			},
			z.array(CourseSummarySchema),
		),
	);
}

/**
 * Fetches a single public course by ID.
 */
export function usePublicCourseSingleQuery(id: string) {
	return useApiQuery(
		queryKeys.courseSingle(id),
		() =>
			apiRequest(
				{
					url: `/api/v1/public/courses/single/${id}`,
					method: "GET",
				},
				CourseDetailSchema,
			),
		{ enabled: !!id },
	);
}

/**
 * Fetches all course categories.
 */
export function useCourseCategoriesQuery() {
	return useApiQuery(queryKeys.courseCategories(), () =>
		apiRequest(
			{
				url: "/api/v1/public/courses/category",
				method: "GET",
			},
			z.array(CategoryResponseSchema),
		),
	);
}

/**
 * Fetches all course names and IDs for the current user.
 */
export function useCourseNamesQuery() {
	return useApiQuery(queryKeys.courseNames(), () =>
		apiRequest(
			{
				url: "/api/v1/courses/name",
				method: "GET",
			},
			z.object({ courses: z.array(UserCourseSchema) }),
		),
	);
}
