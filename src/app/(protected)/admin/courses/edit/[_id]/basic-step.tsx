"use client"

import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useApiHandler } from "@/hooks/useApiHandler"
import { CourseDetailsType } from "@/types/course.type"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface BasicStepProps {
    courseData: CourseDetailsType | null
    setCourseData: React.Dispatch<React.SetStateAction<CourseDetailsType | null>>
}

export default function BasicStep({ courseData, setCourseData }: BasicStepProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        duration: "",
        price: 0,
        originalPrice: 0,
        category: "",
        imageUrl: "",
        previewVideoUrl: ""
    })

    useEffect(() => {
        setFormData({
            title: courseData?.title || "",
            description: courseData?.description || "",
            duration: courseData?.duration || "",
            price: courseData?.price || 0,
            originalPrice: courseData?.originalPrice || 0,
            category: courseData?.category || "",
            imageUrl: courseData?.imageUrl || "",
            previewVideoUrl: courseData?.previewVideoUrl || ""
        })
    }, [courseData])

    const { isLoading, callApi } = useApiHandler()

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const updateCourseData = async () => {
        const response = await fetch(`/api/courses/${courseData?._id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })

        if (response.ok) {
            const updatedCourse = await response.json()
            return updatedCourse
        } else {
            const errorData = await response.json()
            toast.error(errorData.error)
            return null
        }
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await callApi(updateCourseData)
        if (updatedCourseData) {
            setCourseData(updatedCourseData)
            toast.success("Basic information saved successfully")
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
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                            <SelectTrigger className={`w-full`}>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="programming">Programming</SelectItem>
                                <SelectItem value="design">Design</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="photography">Photography</SelectItem>
                                <SelectItem value="music">Music</SelectItem>
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

                {/* <div className="space-y-4">
                    <FileUpload
                        label="Course Image *"
                        value={formData.imageUrl}
                        onChange={(url) => handleInputChange("imageUrl", url)}
                        accept="image/*"
                        error={errors.imageUrl}
                    />

                    <FileUpload
                        label="Preview Video *"
                        value={formData.previewVideoUrl}
                        onChange={(url) => handleInputChange("previewVideoUrl", url)}
                        accept="video/*"
                        error={errors.previewVideoUrl}
                    />
                </div> */}

                <div className="flex justify-end">
                    <LoadingButton isLoading={isLoading} title="Saving changes...">
                        <Button onClick={handleSaveAndContinue}>Save Changes</Button>
                    </LoadingButton>
                </div>
            </CardContent>
        </Card>
    )
}
