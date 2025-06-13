"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResourcesType } from "@/types/course.type"
import { ChevronLeft, Plus, X } from "lucide-react"
import { useState } from "react"
import FileUpload from "./file-upload"

interface ResourcesStepProps {
    onNext: () => void
    onPrev: () => void
}

export default function ResourcesStep({ onNext, onPrev }: ResourcesStepProps) {
    const [resources, setResources] = useState<ResourcesType[]>([{ title: "", fileUrl: "" }])

    const addResource = () => {
        setResources((prev) => [...prev, { title: "", fileUrl: "" }])
    }

    const removeResource = (index: number) => {
        setResources((prev) => prev.filter((_, i) => i !== index))
    }

    const updateResource = (index: number, field: string, value: string) => {
        setResources((prev) => prev.map((resource, i) => (i === index ? { ...resource, [field]: value } : resource)))
    }

    const handleSaveAndContinue = () => {
        onNext()
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Course Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {resources.map((resource, index) => (
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
                                    onChange={(url) => updateResource(index, "fileUrl", url)}
                                    accept="*/*"
                                />
                            </div>
                        </Card>
                    ))}
                </div>

                <Button type="button" variant="outline" onClick={addResource} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                </Button>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={onPrev}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <Button onClick={handleSaveAndContinue}>Save & Continue</Button>
                </div>
            </CardContent>
        </Card>
    )
}
