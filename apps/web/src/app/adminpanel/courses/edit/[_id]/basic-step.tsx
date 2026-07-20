"use client";

import FileUpload from "@/components/file-upload"
import LoadingButton from "@/components/loading-button"
import { Button } from "@package/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card"
import { Input } from "@package/ui/input"
import { Label } from "@package/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select"
import { Textarea } from "@package/ui/textarea"
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api"
import type { Category } from "@package/schema/category.types"
import type { CourseLandingResponse } from "@package/schema/courses.types"
import { useState } from "react"
import { toast } from "sonner"

interface BasicFormData {
    title: string;
    short_description: string;
    category_id: string;
    image_url: string;
    language: string;
    level: string;
}

interface BasicStepProps {
    categories: Category[]
    courseData: CourseLandingResponse
    setCourseData: React.Dispatch<React.SetStateAction<CourseLandingResponse | null>>
}

export default function BasicStep({ categories, courseData, setCourseData }: BasicStepProps) {
    const mutation = useUpdateCourseMutation()

    const [formData, setFormData] = useState<BasicFormData>({
        title: courseData.title || "",
        short_description: courseData.short_description || "",
        category_id: courseData.category?.id || "",
        image_url: courseData.image_url || "",
        language: courseData.language || "",
        level: courseData.level || "",
    })

    const handleInputChange = (field: keyof BasicFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await mutation.execute({
            id: courseData.id,
            data: formData,
        })

        if (updatedCourseData?.data) {
            toast.success("Course basic information saved successfully")
            setCourseData(updatedCourseData.data as unknown as CourseLandingResponse)
        }
    }

    const handleMediaUpload = (field: string, url: string) => {
        if (field === "image_url") {
            setFormData((prev) => ({ ...prev, image_url: url }))
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Course Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            placeholder="Enter course title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category_id">
                            Category *
                        </Label>
                        <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value || "")}>
                            <SelectTrigger className={`w-full`}>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    categories.map((category: Category) => (
                                        category && <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="short_description">Description *</Label>
                    <Textarea
                        id="short_description"
                        value={formData.short_description}
                        onChange={(e) => handleInputChange("short_description", e.target.value)}
                        placeholder="Enter course description"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Input
                            id="language"
                            value={formData.language}
                            onChange={(e) => handleInputChange("language", e.target.value)}
                            placeholder="e.g., English"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="level">Level *</Label>
                        <Input
                            id="level"
                            value={formData.level}
                            onChange={(e) => handleInputChange("level", e.target.value)}
                            placeholder="beginner"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image_url">Image URL</Label>
                        <Input
                            id="image_url"
                            value={formData.image_url}
                            onChange={(e) => handleInputChange("image_url", e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <FileUpload
                        label="Course Image *"
                        onChange={handleMediaUpload}
                        field="image_url"
                        accept="image"
                        value={{ url: formData.image_url, fileType: "image" }}
                    />
                </div>

                <div className="flex justify-end">
                    <LoadingButton isLoading={mutation.isPending} title="Saving Changes...">
                        <Button onClick={handleSaveAndContinue}>Save Changes</Button>
                    </LoadingButton>
                </div>
            </CardContent>
        </Card>
    )
}
