"use client"

import updateCourse from "@/api/update.course.api"
import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApiHandler } from "@/hooks/useApiHandler"
import { CourseSettingsFormType } from "@/types/course.form.type"
import { CourseType } from "@/types/course.type"
import { useState } from "react"
import { toast } from "sonner"

interface SettingsStepProps {
    courseData: CourseType
    setCourseData: React.Dispatch<React.SetStateAction<CourseType | null>>
}

export default function SettingsStep({ courseData, setCourseData }: SettingsStepProps) {
    const [formData, setFormData] = useState<CourseSettingsFormType>({
        isPublished: courseData.isPublished || false,
    })
    const { isLoading, callApi } = useApiHandler()

    const handleSwitchChange = (field: string, value: boolean) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await callApi(() => updateCourse(formData, courseData._id))

        if (updatedCourseData) {
            toast.success("Course settings saved successfully")
            setCourseData(updatedCourseData)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Course Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <Label htmlFor="isPublished" className="text-base font-medium">
                                Publish Course
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Make this course available to students. You can unpublish it at any time.
                            </p>
                        </div>
                        <Switch
                            id="isPublished"
                            checked={formData.isPublished}
                            onCheckedChange={(checked) => handleSwitchChange("isPublished", checked)}
                        />
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Course Status</h4>
                        <p className="text-sm text-muted-foreground">
                            {formData.isPublished
                                ? "Your course is published and visible to students."
                                : "Your course is in draft mode and not visible to students."}
                        </p>
                    </div>
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
