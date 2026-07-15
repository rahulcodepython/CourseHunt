"use client";

import { apiRequest } from "@/api/client";
import { useApiMutation } from "@/api/core/use-api-mutation";
import { UploadMediaResponseZod } from "@/types/upload.types";

export function useUploadMediaMutation() {
	const mutation = useApiMutation(
		({ file, fileType }: { file: File; fileType: string }) => {
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
				UploadMediaResponseZod,
			);
		},
		{
			successMessage: "Media uploaded successfully",
		},
	);

	return {
		...mutation,
		uploadMedia: mutation.execute,
	};
}
