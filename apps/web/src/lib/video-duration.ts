/** Reads a video File's duration client-side (via HTMLVideoElement metadata) before it's uploaded. */
export function readVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(Math.round(video.duration));
        };
        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error("Could not read video duration"));
        };
        video.src = URL.createObjectURL(file);
    });
}
