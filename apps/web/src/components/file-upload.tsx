"use client";

import { Icon } from "@/components/icon";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { useUploadMediaMutation } from "@package/query-hooks/upload.api";
import type { ApiResponse } from "@package/schema/common.types";
import type { UploadMediaResponse } from "@package/schema/upload.types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
	label: string;
	onChange: (field: string, url: string, fileType: string) => void;
	field: string;
	accept: "image" | "video" | "document";
	value: { url: string; fileType: string };
	className?: string;
}

export default function FileUpload({ label, onChange, field, accept, value, className }: FileUploadProps) {
	const [previousValue, setPreviousValue] = useState<{ url: string; fileType: string } | null>(null);
	const { isPending, uploadMedia } = useUploadMediaMutation();
	const fileRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (value && value.url && value.fileType) {
			setPreviousValue(value);
		} else {
			setPreviousValue(null);
		}
	}, [value]);

	const handleFileChange = async () => {
		const selectedFile = fileRef.current?.files?.[0];
		if (selectedFile) {
			const uploadResponse: ApiResponse<UploadMediaResponse> | null = await uploadMedia({ file: selectedFile, fileType: accept });
			if (uploadResponse?.data?.downloadUrl) {
				onChange(field, uploadResponse.data.downloadUrl, accept);
				setPreviousValue({ url: uploadResponse.data.downloadUrl, fileType: accept });
				if (fileRef.current) fileRef.current.value = "";
				toast.success("File uploaded successfully");
			} else {
				toast.error("Upload failed");
			}
		}
	};

	return (
		<div className={`space-y-2 ${className || ""}`}>
			<Label>{label}</Label>
			<div className="flex items-center gap-4">
				{previousValue?.url && accept === "image" && (
					<Image src={previousValue.url} alt="Preview" width={80} height={80} className="rounded-lg object-cover" />
				)}
				<Input ref={fileRef} type="file" accept={accept === "image" ? "image/*" : accept === "video" ? "video/*" : ".pdf,.doc,.docx"} onChange={handleFileChange} disabled={isPending} />
			</div>
		</div>
	);
}
