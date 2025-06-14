"use client"

import updateCourseDetails from "@/api/update.course.details.api"
import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useApiHandler } from "@/hooks/useApiHandler"
import { CourseDetailsFormType } from "@/types/course.form.type"
import { CourseType } from "@/types/course.type"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function DetailsStep({ courseData, setCourseData }: {
    courseData: CourseType
    setCourseData: React.Dispatch<React.SetStateAction<CourseType | null>>
}) {
    const [formData, setFormData] = useState<CourseDetailsFormType>({
        longDescription: courseData.longDescription || "",
        whatYouWillLearn: courseData.whatYouWillLearn || [""],
        prerequisites: courseData.prerequisites || [""],
        requirements: courseData.requirements || [""],
    })
    const { isLoading, callApi } = useApiHandler()

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleWhatYouWillLearnChange = (index: number, value: string) => {
        setFormData((prev) => ({
            ...prev,
            whatYouWillLearn: prev.whatYouWillLearn.map((item: string, i: number) => (i === index ? value : item)),
        }))
    }

    const addWhatYouWillLearn = () => {
        setFormData((prev) => ({
            ...prev,
            whatYouWillLearn: [...prev.whatYouWillLearn, ""],
        }))
    }

    const removeWhatYouWillLearn = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            whatYouWillLearn: prev.whatYouWillLearn.filter((_: string, i: number) => i !== index),
        }))
    }

    const handlePrerequisitesChange = (index: number, value: string) => {
        setFormData((prev) => ({
            ...prev,
            prerequisites: prev.prerequisites.map((item: string, i: number) => (i === index ? value : item)),
        }))
    }

    const addPrerequisites = () => {
        setFormData((prev) => ({
            ...prev,
            prerequisites: [...prev.prerequisites, ""],
        }))
    }

    const removePrerequisites = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            prerequisites: prev.prerequisites.filter((_: string, i: number) => i !== index),
        }))
    }

    const handleRequirementsChange = (index: number, value: string) => {
        setFormData((prev) => ({
            ...prev,
            requirements: prev.requirements.map((item: string, i: number) => (i === index ? value : item)),
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
            requirements: prev.requirements.filter((_: string, i: number) => i !== index),
        }))
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await callApi(() => updateCourseDetails(formData, courseData._id), () => {
            toast.success("Course details updated successfully")
        }
        )
        if (updatedCourseData) {
            setCourseData(updatedCourseData)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="longDescription">Long Description</Label>
                    <Textarea
                        id="longDescription"
                        value={formData.longDescription}
                        onChange={(e) => handleInputChange("longDescription", e.target.value)}
                        placeholder="Provide a detailed description of your course..."
                        rows={5}
                    />
                </div>

                {/* What You Will Learn Section */}
                <div className="space-y-2">
                    <Label>What You Will Learn</Label>
                    {formData.whatYouWillLearn.map((item: string, index: number) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={item}
                                onChange={(e) => handleWhatYouWillLearnChange(index, e.target.value)}
                                placeholder="Enter a learning outcome"
                                className="flex-1"
                            />
                            {formData.whatYouWillLearn.length > 1 && (
                                <Button type="button" variant="outline" size="icon" onClick={() => removeWhatYouWillLearn(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addWhatYouWillLearn} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Learning Outcome
                    </Button>
                </div>

                {/* Prerequisites Section */}
                <div className="space-y-2">
                    <Label>Prerequisites</Label>
                    {formData.prerequisites.map((item: string, index: number) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={item}
                                onChange={(e) => handlePrerequisitesChange(index, e.target.value)}
                                placeholder="Enter a prerequisite"
                                className="flex-1"
                            />
                            {formData.prerequisites.length > 1 && (
                                <Button type="button" variant="outline" size="icon" onClick={() => removePrerequisites(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addPrerequisites} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Prerequisite
                    </Button>
                </div>

                {/* Requirements Section */}
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
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addRequirements} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Requirement
                    </Button>
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
