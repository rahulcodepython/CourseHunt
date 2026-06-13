"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation } from "./generics";

// =============================================================================
// Hooks
// =============================================================================

/**
 * Creates a new feedback for a course.
 */
export function useCreateFeedbackMutation() {
	const mutation = useApiMutation((data: { courseId: number; message: string; rating: number }) =>
		apiRequest(
			{
				url: "/api/v1/feedback/create",
				method: "POST",
				data: data,
			},
			z.object({ message: z.string() }),
		),
	);

	return {
		...mutation,
		createFeedback: mutation.execute,
	};
}
