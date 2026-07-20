"use client";

import { Icon } from "@/components/icon";

import LoadingButton from "@/components/loading-button"
import { Button } from "@package/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card"
import { Input } from "@package/ui/input"
import { Label } from "@package/ui/label"
import { Textarea } from "@package/ui/textarea"
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api"
import type { CourseLandingResponse } from "@package/schema/courses.types"

import { useState } from "react"
import { toast } from "sonner"

interface DetailsFormData {
    long_description: string;
    benefits: string[];
    requirements: string[];
}

export default function DetailsStep({ courseData, setCourseData }: {
    courseData: CourseLandingResponse
    setCourseData: React.Dispatch<React.SetStateAction<CourseLandingResponse | null>>
}) {
    const [formData, setFormData] = useState<DetailsFormData>({
        long_description: courseData.long_description || "",
        benefits: courseData.benefits || [""],
        requirements: courseData.requirements || [""],
    })
    const mutation = useUpdateCourseMutation()

    const handleInputChange = (field: keyof DetailsFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleBenefitsChange = (index: number, value: string) => {
        setFormData((prev) => ({
            ...prev,
            benefits: prev.benefits.map((item, i) => (i === index ? value : item)),
        }))
    }

    const addBenefits = () => {
        setFormData((prev) => ({
            ...prev,
            benefits: [...prev.benefits, ""],
        }))
    }

    const removeBenefits = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            benefits: prev.benefits.filter((_, i) => i !== index),
        }))
    }

    const handleRequirementsChange = (index: number, value: string) => {
        setFormData((prev) => ({
            ...prev,
            requirements: prev.requirements.map((item, i) => (i === index ? value : item)),
        }))
    }

    const addRequirements = () => {
        setFormData((prev) => ({
            ...prev,
            requirements: [...prev.requirements, ""],
        }))
    }

    const removeRequirements = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index),
        }))
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await mutation.execute({
            id: courseData.id,
            data: formData,
        })

        if (updatedCourseData?.data) {
            toast.success("Course details saved successfully")
            setCourseData(updatedCourseData.data as unknown as CourseLandingResponse)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="long_description">Long Description</Label>
                    <Textarea
                        id="long_description"
                        value={formData.long_description}
                        onChange={(e) => handleInputChange("long_description", e.target.value)}
                        placeholder="Provide a detailed description of your course..."
                        rows={5}
                    />
                </div>

                <div className="space-y-2">
                    <Label>What You Will Learn</Label>
                    {formData.benefits.map((item: string, index: number) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={item}
                                onChange={(e) => handleBenefitsChange(index, e.target.value)}
                                placeholder="Enter a learning outcome"
                                className="flex-1"
                            />
                            {formData.benefits.length > 1 && (
                                <Button type="button" variant="outline" size="icon" onClick={() => removeBenefits(index)}>
                                    <Icon name="IconX" className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addBenefits} className="w-full">
                        <Icon name="IconPlus" className="h-5 w-5 mr-2" />
                        Add Learning Outcome
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label>Requirements</Label>
                    {formData.requirements.map((item: string, index: number) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={item}
                                onChange={(e) => handleRequirementsChange(index, e.target.value)}
                                placeholder="Enter a requirement"
                                className="flex-1"
                            />
                            {formData.requirements.length > 1 && (
                                <Button type="button" variant="outline" size="icon" onClick={() => removeRequirements(index)}>
                                    <Icon name="IconX" className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addRequirements} className="w-full">
                        <Icon name="IconPlus" className="h-5 w-5 mr-2" />
                        Add Requirement
                    </Button>
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
