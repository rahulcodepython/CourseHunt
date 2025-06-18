"use client"

import uploadMedia from "@/api/upload.media.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiHandler } from "@/hooks/useApiHandler"
import { Upload } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
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
}

export default function FileUpload({ label, onChange, field, accept, value }: FileUploadProps) {
    const [previousValue, setPreviousValue] = useState(value)

    const { isLoading, callApi } = useApiHandler()

    const fileRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async () => {
        const selectedFile = fileRef.current?.files?.[0]
        if (selectedFile) {
            const uploadResponse = await callApi(() => uploadMedia(selectedFile, accept))

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
        <div className="space-y-2">
            <Label>{label}</Label>

            <div className="flex items-center gap-2">
                <Input type="file" className="flex-1" accept={accept + '/*'} ref={fileRef} />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFileChange}
                    disabled={isLoading}
                >
                    <Upload className="h-4 w-4" />
                </Button>
            </div>
            {
                previousValue && previousValue.url.length > 2 && !isLoading && previousValue.fileType === 'image' ? <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <Image src={previousValue.url} alt="Uploaded file" width={50} height={50} />
                    <span className="flex-1 text-sm truncate">{previousValue.url}</span>
                </div> : previousValue.fileType === 'video' ? <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <video src={previousValue.url} width={50} height={50} />
                    <span className="flex-1 text-sm truncate">{previousValue.url}</span>
                </div> : previousValue.fileType === 'document' ? <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <span className="flex-1 text-sm truncate">{previousValue.url}</span>
                </div> : null
            }
        </div>
    )
}
