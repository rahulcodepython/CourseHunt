import { apiRequest } from "@/react-query/client";
import { useSimpleMutation } from "@/react-query/mutation";
import { UploadMediaResponseZod } from "@/schema/upload.types";
import { z } from "zod";
import axios from "axios";

export const SignedURLResponseZod = z.object({
  url: z.string(),
  downloadUrl: z.string(),
  htmlUrl: z.string(),
});

export async function getSignedUrl(fileName: string) {
  const res = await apiRequest(
    {
      url: `/api/v1/upload/signed-url?file_name=${encodeURIComponent(fileName)}`,
      method: "GET",
    },
    SignedURLResponseZod,
  );
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to retrieve signed URL");
  }
  return res.data;
}

export function useUploadMediaMutation() {
  const mutation = useSimpleMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: string }) => {
      const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const signedInfo = await getSignedUrl(uniqueFileName);

      await axios.put(signedInfo.url, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      return {
        success: true,
        message: "Media uploaded successfully",
        data: {
          downloadUrl: signedInfo.downloadUrl,
          htmlUrl: signedInfo.htmlUrl,
          status: 200,
        },
      };
    },
    showToast: true,
  });

  return {
    ...mutation,
    uploadMedia: mutation.execute,
  };
}
