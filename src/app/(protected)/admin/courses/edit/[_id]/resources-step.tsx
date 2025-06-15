"use client"

import updateCourse from "@/api/update.course.api"
import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiHandler } from "@/hooks/useApiHandler"
import { CourseType, MediaUrlType, ResourcesType } from "@/types/course.type"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import FileUpload from "./file-upload"

interface ResourcesStepProps {
    courseData: CourseType
    setCourseData: React.Dispatch<React.SetStateAction<CourseType | null>>
}

export default function ResourcesStep({ courseData, setCourseData }: ResourcesStepProps) {
    const [resources, setResources] = useState<ResourcesType[]>(courseData.resources || [{ title: "", fileUrl: { url: "", fileType: "" } }])

    const { isLoading, callApi } = useApiHandler()

    const addResource = () => {
        setResources((prev) => [...prev, { title: "", fileUrl: { url: "", fileType: "" } }])
    }

    const removeResource = (index: number) => {
        setResources((prev) => prev.filter((_, i) => i !== index))
    }

    const updateResource = (index: number, field: string, value: string | MediaUrlType) => {
        setResources((prev) => prev.map((resource, i) => (i === index ? { ...resource, [field]: value } : resource)))
    }

    const updateResourceFile = (field: string, url: string, fileType: string) => {
        setResources((prev) => prev.map((resource, i) => (i === Number(field) ? { ...resource, fileUrl: { url, fileType } } : resource)))
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await callApi(() => updateCourse({ resources: resources }, courseData._id))

        if (updatedCourseData) {
            toast.success("Course resources saved successfully")
            setCourseData(updatedCourseData)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Course Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {
                        resources.map((resource, index) => (
                            <Card key={index} className="p-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Resource {index + 1}</h4>
                                        {resources.length > 1 && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => removeResource(index)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Resource Title</Label>
                                        <Input
                                            value={resource.title}
                                            onChange={(e) => updateResource(index, "title", e.target.value)}
                                            placeholder="Enter resource title"
                                        />
                                    </div>
                                    <FileUpload
                                        label="Resource File"
                                        value={resource.fileUrl}
                                        onChange={updateResourceFile}
                                        accept="document"
                                        field={String(index)}
                                    />
                                </div>
                            </Card>
                        ))
                    }
                </div>

                <Button type="button" variant="outline" onClick={addResource} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                </Button>

                <div className="flex justify-end">
                    <LoadingButton isLoading={isLoading} title="Saving Changes...">
                        <Button onClick={handleSaveAndContinue}>Save Changes</Button>
                    </LoadingButton>
                </div>
            </CardContent>
        </Card>
    )
}
