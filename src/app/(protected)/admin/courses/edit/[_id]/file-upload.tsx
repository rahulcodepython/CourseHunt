"use client"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { UploadResponseType } from "@/types/imagekit.type"
import uploadMedia from "@/utils/uploadMedia"
import { Image } from "@imagekit/next"
import { Upload } from "lucide-react"
import { useRef, useState } from "react"

interface FileUploadProps {
    label: string
    onChange: (field: string, url: string, thumbnailUrl: string, fileType?: string) => void
    field: string
    accept: string
    value: {
        url: string
        thumbnailUrl: string
        fileType: string
    }
}

export default function FileUpload({ label, onChange, field, accept, value }: FileUploadProps) {
    const [progress, setProgress] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [previousValue, setPreviousValue] = useState(value)

    const fileRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async () => {
        const selectedFile = fileRef.current?.files?.[0]
        if (selectedFile) {
            setProgress(0)
            setUploading(true)

            const folderPath = selectedFile.type.startsWith('image/') ? '/courses/images' : '/courses/videos';
            const uploadResponse: UploadResponseType | null = await uploadMedia(selectedFile, setProgress, folderPath).finally(() => {
                setUploading(false)
                fileRef.current!.value = ""
            })

            if (uploadResponse) {
                const { url, thumbnailUrl, fileType } = uploadResponse;
                onChange(field, url, thumbnailUrl, fileType);
                setPreviousValue({ url, thumbnailUrl, fileType });
            }
        }
    }


    return (
        <div className="space-y-2">
            <Label>{label}</Label>

            <div className="flex items-center gap-2">
                <Input type="file" className="flex-1" accept={accept} ref={fileRef} />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFileChange}
                    disabled={uploading}
                >
                    <Upload className="h-4 w-4" />
                </Button>
            </div>

            {uploading && (
                <Progress
                    value={progress}
                    className="mt-2"
                    style={{ width: "100%" }}
                />
            )}
            {
                previousValue && !uploading && previousValue.fileType === 'image' ? <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <Image src={previousValue.thumbnailUrl} alt="Uploaded file" width={50} height={50} />
                    <span className="flex-1 text-sm truncate">{previousValue.url}</span>
                </div> : null
            }
        </div>
    )
}
