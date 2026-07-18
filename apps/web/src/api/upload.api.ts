"use client";

import { apiRequest } from "@/lib/client";

import { useSimpleMutation } from "@/lib/mutation";
import { UploadMediaResponseZod } from "@/types/upload.types";

export function useUploadMediaMutation() {
	const mutation = useSimpleMutation({
		mutationFn: ({ file, fileType }: { file: File; fileType: string }) => {
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
		showToast: true,
	});

	return {
		...mutation,
		uploadMedia: mutation.execute,
	};
}
