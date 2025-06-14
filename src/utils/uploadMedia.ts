import { AuthenticatorType, UploadResponseType } from "@/types/imagekit.type";
import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload
} from "@imagekit/next";
import { toast } from "sonner";



const authenticator = async (): Promise<AuthenticatorType | null> => {
    try {
        const response = await fetch("/api/upload-auth");

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        toast.error(`Authentication error: ${error}`);
        return null;
    }
};

const uploadMedia = async (file: File, setProgress: React.Dispatch<React.SetStateAction<number>>, folder: string): Promise<UploadResponseType | null> => {
    const abortController = new AbortController();

    try {
        if (!file) {
            throw new Error("No file provided for upload.");
        }

        const authenticatorResponse = await authenticator();

        if (!authenticatorResponse) {
            throw new Error("Failed to authenticate for upload.");
        }

        const uploadResponse = await upload({
            // Authentication parameters
            expire: authenticatorResponse.expire,
            token: authenticatorResponse.token,
            signature: authenticatorResponse.signature,
            publicKey: authenticatorResponse.publicKey,
            file,
            fileName: file.name,
            folder: `/coursehunt${folder}`,
            overwriteFile: true, // Overwrite existing file with the same name
            onProgress: (event) => {
                setProgress((event.loaded / event.total) * 100);
            },
            abortSignal: abortController.signal,
        });

        if (!uploadResponse) {
            throw new Error("Upload response is null or undefined.");
        }

        return {
            fileType: uploadResponse.fileType ?? "unknown",
            thumbnailUrl: uploadResponse.thumbnailUrl ?? "",
            url: uploadResponse.url ?? "",
        }
    } catch (error) {
        if (error instanceof ImageKitAbortError) {
            toast.error(`Upload aborted: ${error.reason}`);
        } else if (error instanceof ImageKitInvalidRequestError) {
            toast.error(`Invalid request: ${error.message}`);
        } else if (error instanceof ImageKitUploadNetworkError) {
            toast.error(`Network error: ${error.message}`);
        } else if (error instanceof ImageKitServerError) {
            toast.error(`Server error: ${error.message}`);
        } else {
            // Handle any other errors that may occur.
            toast.error(`Upload error: ${error}`);
        }
        return null;
    }
}

export default uploadMedia;