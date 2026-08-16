"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/icon";
import { getSignedUrl } from "@/query-hooks/upload.api";
import { registerPendingUpload, removePendingUpload } from "@/lib/pending-uploads";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

interface FileUploadProps {
	label: string;
	onChange: (field: string, url: string, fileType: string) => void;
	field: string;
	accept: "image" | "video" | "document";
	value: { url: string; fileType: string };
	className?: string;
	/** Fired synchronously with the raw File the moment it's selected, before upload starts (e.g. to read video duration client-side). */
	onFileSelected?: (file: File) => void;
}

const ACCEPT_EXTENSIONS: Record<FileUploadProps["accept"], string> = {
	image: ".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.tif,.heic,.ico,.raw,.psd,.ai",
	video: ".mp4,.mov,.mkv,.avi,.wmv,.flv,.webm,.m4v,.3gp,.mpeg,.mpg",
	document: ".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.csv,.ppt,.pptx",
};

const ACCEPT_ICON: Record<FileUploadProps["accept"], IconName> = {
	image: "book",
	video: "play",
	document: "file-text",
};

const ACCEPT_HINT: Record<FileUploadProps["accept"], string> = {
	image: "PNG, JPG, WEBP or GIF",
	video: "MP4, MOV or WEBM",
	document: "PDF, DOCX or other documents",
};

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileNameFromUrl(url: string): string {
	try {
		return decodeURIComponent(url.split("/").pop()?.split("?")[0] || "file");
	} catch {
		return url.split("/").pop() || "file";
	}
}

export default function FileUpload({ label, onChange, field, accept, value, className, onFileSelected }: FileUploadProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [pendingSignedUrl, setPendingSignedUrl] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isResolving, setIsResolving] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const clearSelection = () => {
		if (pendingSignedUrl) removePendingUpload(pendingSignedUrl);
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setSelectedFile(null);
		setPendingSignedUrl(null);
		setPreviewUrl(null);
	};

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	useEffect(() => {
		if (!value.url && selectedFile) {
			clearSelection();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value.url]);

	const handleFileChange = async () => {
		const file = fileRef.current?.files?.[0];
		if (!file) return;

		clearSelection();
		onFileSelected?.(file);

		if (accept === "image") {
			setPreviewUrl(URL.createObjectURL(file));
		}
		setSelectedFile(file);
		setIsResolving(true);

		try {
			const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
			const signedInfo = await getSignedUrl(uniqueFileName);
			setPendingSignedUrl(signedInfo.url);
			registerPendingUpload(signedInfo.url, file);
			onChange(field, signedInfo.downloadUrl, accept);
		} catch (err) {
			console.error("[FileUpload]", err);
			toast.error("Failed to prepare the file for upload. Please try again.");
			clearSelection();
		} finally {
			setIsResolving(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};

	const handleRemove = () => {
		clearSelection();
		onChange(field, "", accept);
		if (fileRef.current) fileRef.current.value = "";
	};

	const showExisting = !selectedFile && !!value.url;

	return (
		<div className={`space-y-2 ${className || ""}`}>
			<Label>{label}</Label>

			{selectedFile ? (
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					{accept === "image" && previewUrl ? (
						/* eslint-disable-next-line @next/next/no-img-element */
						<img src={previewUrl} alt={selectedFile.name} className="size-12 shrink-0 rounded-md object-cover" />
					) : (
						<div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
							<Icon name={ACCEPT_ICON[accept]} className="size-5 text-muted-foreground" />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{selectedFile.name}</p>
						<p className="text-xs text-muted-foreground">
							{formatFileSize(selectedFile.size)}
							{isResolving && " · preparing upload…"}
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={handleRemove}
						disabled={isResolving}
						aria-label="Remove file"
						className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
					>
						<Icon name="trash" className="size-4" />
					</Button>
				</div>
			) : showExisting ? (
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					{accept === "image" && value.url ? (
						/* eslint-disable-next-line @next/next/no-img-element */
						<img src={value.url} alt={fileNameFromUrl(value.url)} className="size-12 shrink-0 rounded-md object-cover" />
					) : (
						<div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
							<Icon name={ACCEPT_ICON[accept]} className="size-5 text-muted-foreground" />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{fileNameFromUrl(value.url)}</p>
						<p className="text-xs text-muted-foreground">Uploaded file</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={handleRemove}
						aria-label="Remove file"
						className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
					>
						<Icon name="trash" className="size-4" />
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => fileRef.current?.click()}
					disabled={isResolving}
					className={cn(
						"flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
						"hover:border-primary hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						"disabled:cursor-not-allowed disabled:opacity-60",
					)}
				>
					<div className="flex size-10 items-center justify-center rounded-full bg-muted">
						<Icon name={ACCEPT_ICON[accept]} className="size-5 text-muted-foreground" />
					</div>
					<span className="text-sm font-medium">
						{isResolving ? "Preparing upload…" : "Choose file"}
					</span>
					<span className="text-xs text-muted-foreground">
						{ACCEPT_HINT[accept]}
					</span>
				</button>
			)}

			<Input
				ref={fileRef}
				type="file"
				accept={ACCEPT_EXTENSIONS[accept]}
				onChange={handleFileChange}
				disabled={isResolving}
				className="hidden"
			/>
		</div>
	);
}