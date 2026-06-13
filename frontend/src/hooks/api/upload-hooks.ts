"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation } from "./generics";

// =============================================================================
// Schemas
// =============================================================================

const UploadMediaResponseSchema = z.object({
	downloadUrl: z.string(),
	htmlUrl: z.string(),
	status: z.number(),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Uploads media files (images, videos) to the server.
 */
export function useUploadMediaMutation() {
	const mutation = useApiMutation(({ file, fileType }: { file: File; fileType: string }) => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("fileType", fileType);

		return apiRequest(
			{
				url: "/api/v1/upload-media",
				method: "POST",
				data: formData,
				headers: {
					"Content-Type": "multipart/form-data",
				},
			},
			UploadMediaResponseSchema,
		);
	});

	return {
		...mutation,
		uploadMedia: mutation.execute,
	};
}
