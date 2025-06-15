export default async function uploadMedia(file: File, fileType: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);

    const response = await fetch("/api/upload-media", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
    }

    return await response.json();
}
