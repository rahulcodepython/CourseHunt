"use client"

import updateCourse from "@/api/update.course.api"
import FileUpload from "@/components/file-upload"
import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useApiHandler } from "@/hooks/useApiHandler"
import { CourseCategoryType } from "@/types/course.category.type"
import { CourseBasicFormType } from "@/types/course.form.type"
import { CourseType } from "@/types/course.type"
import { useState } from "react"
import { toast } from "sonner"

interface BasicStepProps {
    categories: CourseCategoryType[]
    courseData: CourseBasicFormType & {
        _id: string
    }
    setCourseData: React.Dispatch<React.SetStateAction<CourseType | null>>
}

export default function BasicStep({ categories, courseData, setCourseData }: BasicStepProps) {
    const { isLoading, callApi } = useApiHandler()

    const [formData, setFormData] = useState<CourseBasicFormType>({
        title: courseData.title || "",
        description: courseData.description || "",
        duration: courseData.duration || "",
        price: courseData.price || 0,
        originalPrice: courseData.originalPrice || 0,
        category: courseData.category || "",
        imageUrl: {
            url: courseData.imageUrl?.url || "",
            fileType: courseData.imageUrl.fileType || ""
        },
        previewVideoUrl: {
            url: courseData.previewVideoUrl?.url || "",
            fileType: courseData.previewVideoUrl.fileType || ""
        }
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev: CourseBasicFormType) => ({ ...prev, [field]: value }))
    }

    const handleSaveAndContinue = async () => {
        const discount = (formData.originalPrice - formData.price) / formData.originalPrice * 100

        const updatedCourseData = await callApi(() => updateCourse({
            ...formData,
            discount: `${isNaN(discount) ? 0 : Math.round(discount)}%`,
        }, courseData._id))

        if (updatedCourseData) {
            toast.success("Course basic information saved successfully")
            setCourseData(updatedCourseData)
        }
    }

    const handleMediaUpload = (field: string, url: string, fileType?: string) => {
        setFormData((prev: CourseBasicFormType) => ({
            ...prev,
            [field]: {
                url,
                fileType
            }
        }))
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
                        <Label htmlFor="category">
                            Category *
                        </Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                            <SelectTrigger className={`w-full`}>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    categories.map((category) => (
                                        category && <SelectItem key={category._id} value={category.name}>
                                            {category.name}
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Enter course description"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Input
                            id="duration"
                            value={formData.duration}
                            onChange={(e) => handleInputChange("duration", e.target.value)}
                            placeholder="e.g., 10 hours"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Price *</Label>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", e.target.value)}
                            placeholder="99.99"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="originalPrice">Original Price *</Label>
                        <Input
                            id="originalPrice"
                            type="number"
                            value={formData.originalPrice}
                            onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                            placeholder="199.99"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <FileUpload
                        label="Course Image *"
                        onChange={handleMediaUpload}
                        field="imageUrl"
                        accept="image"
                        value={formData.imageUrl}
                    />

                    <FileUpload
                        label="Preview Video *"
                        onChange={handleMediaUpload}
                        field="previewVideoUrl"
                        accept="video"
                        value={formData.previewVideoUrl}
                    />
                </div>

                <div className="flex justify-end">
                    <LoadingButton isLoading={isLoading} title="Saving Changes...">
                        <Button onClick={handleSaveAndContinue}>Save Changes</Button>
                    </LoadingButton>
                </div>
            </CardContent>
        </Card>
    )
}
