"use client";

import { Icon } from "@/components/icon";

import FileUpload from "@/components/file-upload"
import LoadingButton from "@/components/loading-button"
import { Button } from "@package/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card"
import { Input } from "@package/ui/input"
import { Label } from "@package/ui/label"
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api"
import type { CourseLandingResponse } from "@package/schema/courses.types"

import { useState } from "react"
import { toast } from "sonner"

interface ResourceFormData {
    title: string;
    fileUrl: { url: string; fileType: string };
}

export default function ResourcesStep({ courseData, setCourseData }: {
    courseData: CourseLandingResponse
    setCourseData: React.Dispatch<React.SetStateAction<CourseLandingResponse | null>>
}) {
    const [resources, setResources] = useState<ResourceFormData[]>([{ title: "", fileUrl: { url: "", fileType: "" } }])
    const mutation = useUpdateCourseMutation()

    const addResource = () => {
        setResources((prev) => [...prev, { title: "", fileUrl: { url: "", fileType: "" } }])
    }

    const removeResource = (index: number) => {
        setResources((prev) => prev.filter((_, i) => i !== index))
    }

    const updateResource = (index: number, field: keyof ResourceFormData, value: string | { url: string; fileType: string }) => {
        setResources((prev) => prev.map((resource, i) => (i === index ? { ...resource, [field]: value } : resource)))
    }

    const updateResourceFile = (field: string, url: string, fileType: string) => {
        setResources((prev) => prev.map((resource, i) => (i === Number(field) ? { ...resource, fileUrl: { url, fileType } } : resource)))
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await mutation.execute({
            id: courseData.id,
            data: { resources } as unknown as Record<string, unknown>,
        })

        if (updatedCourseData?.data) {
            toast.success("Course resources saved successfully")
            setCourseData(updatedCourseData.data as unknown as CourseLandingResponse)
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
                                                <Icon name="IconX" className="h-5 w-5" />
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
                    <Icon name="IconPlus" className="h-5 w-5 mr-2" />
                    Add Resource
                </Button>

                <div className="flex justify-end">
                    <LoadingButton isLoading={mutation.isPending} title="Saving Changes...">
                        <Button onClick={handleSaveAndContinue}>Save Changes</Button>
                    </LoadingButton>
                </div>
            </CardContent>
        </Card>
    )
}
