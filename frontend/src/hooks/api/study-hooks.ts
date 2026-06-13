"use client";

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

const LessonSchema = z.object({
	id: z.number(),
	_id: z.number(),
	chapter_id: z.number().optional(),
	title: z.string(),
	duration: z.string(),
	type: z.string(), // 'video', 'reading'
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

const ViewedLessonSchema = z.object({
	chapterId: z.number(),
	lessonId: z.number(),
	viewedAt: z.string(),
});

const ResourceSchema = z.object({
	id: z.number().optional(),
	title: z.string(),
	fileUrl: MediaSchema,
});

const StudyCourseSchema = z.object({
	_id: z.number(),
	title: z.string(),
	totalLessons: z.number(),
	completedLessons: z.number(),
	completed: z.boolean(),
	lastViewedLessonId: z.number(),
	viewedLessons: z.array(ViewedLessonSchema),
	chapters: z.array(ChapterSchema),
	resources: z.array(ResourceSchema),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches study materials and progress for a specific course.
 */
export function useCourseStudyQuery(id: string) {
	return useApiQuery(
		queryKeys.courseStudy(id),
		() =>
			apiRequest(
				{
					url: `/api/v1/study/${id}`,
					method: "GET",
				},
				StudyCourseSchema,
			),
		{ enabled: !!id },
	);
}

/**
 * Updates the last viewed lesson for a course.
 */
export function useUpdateLastViewedMutation() {
	const mutation = useApiMutation((data: { lessonId: number; courseId: number }) =>
		apiRequest(
			{
				url: "/api/v1/study/set-last-viewed",
				method: "POST",
				data: data,
			},
			z.object({ message: z.string() }),
		),
	);

	return {
		...mutation,
		updateLastViewed: mutation.execute,
	};
}

/**
 * Marks a lesson as read/completed.
 */
export function useUpdateLessonReadMutation() {
	const mutation = useApiMutation(
		(data: { lessonId: number; chapterId: number; courseId: number }) =>
			apiRequest(
				{
					url: "/api/v1/study/mark-read",
					method: "POST",
					data: data,
				},
				z.object({ message: z.string() }),
			),
	);

	return {
		...mutation,
		updateLessonRead: mutation.execute,
	};
}
