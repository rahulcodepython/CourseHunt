"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, File } from "lucide-react"

interface FileUploadProps {
  label: string
  value: string
  onChange: (url: string) => void
  accept?: string
  error?: string
}

export default function FileUpload({ label, value, onChange, accept = "*/*", error }: FileUploadProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real application, you would upload the file to a server
      // and get back a URL. For this demo, we'll create a mock URL
      const mockUrl = `https://example.com/uploads/${file.name}`
      onChange(mockUrl)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    onChange("")
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {!value || isEditing ? (
        <div className="space-y-2">
          <Input type="file" accept={accept} onChange={handleFileChange} className={error ? "border-red-500" : ""} />
          {isEditing && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
          <File className="h-4 w-4" />
          <span className="flex-1 text-sm truncate">{value}</span>
          <Button type="button" variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
