import axios from "axios";
import { toast } from "sonner";

type PendingUpload = {
	signedUrl: string;
	file: File;
};

/**
 * Client-side registry of files whose signed PUT URL has been requested but
 * whose actual upload is deferred until form submission. Storing only the
 * signed URL on selection avoids orphaned S3 objects when the user picks a
 * file and then deselects it before submitting.
 */
const pending = new Map<string, PendingUpload>();

export function registerPendingUpload(signedUrl: string, file: File) {
	pending.set(signedUrl, { signedUrl, file });
}

export function removePendingUpload(signedUrl: string) {
	pending.delete(signedUrl);
}

export function clearPendingUploads() {
	pending.clear();
}

/** Upload every registered file in parallel and drain the queue. Never throws. */
export async function flushPendingUploads(): Promise<void> {
	const items = Array.from(pending.values());
	pending.clear();
	if (items.length === 0) return;
	await Promise.all(
		items.map(async ({ signedUrl, file }) => {
			try {
				await axios.put(signedUrl, file, {
					headers: {
						"Content-Type": file.type || "application/octet-stream",
					},
				});
			} catch (err) {
				console.error("[Upload]", err);
				toast.error(`Failed to upload "${file.name}".`);
			}
		}),
	);
}