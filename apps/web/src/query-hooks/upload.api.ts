import { apiRequest } from "@/react-query/client";
import { useSimpleMutation } from "@/react-query/mutations";
import { UploadMediaResponseZod } from "@/schema/upload.types";
import { API_ENDPOINTS } from "@/lib/constants/const";
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
      url: API_ENDPOINTS.UPLOAD_SIGNED_URL,
      method: "GET",
      params: { file_name: fileName },
    },
    SignedURLResponseZod,
  );
  return res;
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
        downloadUrl: signedInfo.downloadUrl,
        htmlUrl: signedInfo.htmlUrl,
        status: 200,
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
