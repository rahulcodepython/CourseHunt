"use client";

import { Icon } from "@/components/icon";


import { Button } from "@package/ui/button"
import { Input } from "@package/ui/input"
import { Label } from "@package/ui/label"
import { useUploadMediaMutation } from "@/hooks/api"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface FileUploadProps {
    label: string
    onChange: (field: string, url: string, fileType: string) => void
    field: string
    accept: 'image' | 'video' | 'document'
    value: {
        url: string
        fileType: string
    }
    className?: string
}

export default function FileUpload({ label, onChange, field, accept, value, className }: FileUploadProps) {
    const [previousValue, setPreviousValue] = useState<{ url: string; fileType: string } | null>(null)

    const { isPending, uploadMedia } = useUploadMediaMutation()

    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (value && value.url && value.fileType) {
            setPreviousValue(value);
        } else {
            setPreviousValue(null);
        }
    }, [value])

    const handleFileChange = async () => {
        const selectedFile = fileRef.current?.files?.[0]
        if (selectedFile) {
            const uploadResponse = await uploadMedia({
                file: selectedFile,
                fileType: accept,
            })

            if (uploadResponse) {
                onChange(field, uploadResponse.downloadUrl, accept);
                setPreviousValue({
                    url: uploadResponse.downloadUrl,
                    fileType: accept
                });
                fileRef.current!.value = "" // Clear the file input after upload
                toast.success("File uploaded successfully");
            }
        }
    }


    return (
        <div className={`space-y-2 ${className || ''}`}>
            <Label>{label}</Label>

            <div className="flex items-center gap-2">
                <Input type="file" className="flex-1" accept={accept + '/*'} ref={fileRef} />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFileChange}
                    disabled={isPending}
                >
                    <Icon name="IconUpload" className="h-5 w-5" />
                </Button>
            </div>
            {
                previousValue ? previousValue.url.length > 2 && !isPending && previousValue.fileType === 'image' ? <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <Image src={previousValue.url} alt="Uploaded file" width={50} height={50} />
                    <span className="flex-1 text-sm truncate">{previousValue.url}</span>
                </div> : previousValue.fileType === 'video' ? <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <video src={previousValue.url} width={50} height={50} />
                    <span className="flex-1 text-sm truncate">{previousValue.url}</span>
                </div> : previousValue.fileType === 'document' ? <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <span className="flex-1 text-sm truncate">{previousValue.url}</span>
                </div> : null : null
            }
        </div>
    )
}
