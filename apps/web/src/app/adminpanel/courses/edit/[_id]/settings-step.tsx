"use client";

import LoadingButton from "@/components/loading-button"
import { Button } from "@package/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card"
import { Label } from "@package/ui/label"
import { Switch } from "@package/ui/switch"
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api"
import type { CourseLandingResponse } from "@package/schema/courses.types"
import { useState } from "react"
import { toast } from "sonner"

interface SettingsFormData {
    status: string;
}

interface SettingsStepProps {
    courseData: CourseLandingResponse
    setCourseData: React.Dispatch<React.SetStateAction<CourseLandingResponse | null>>
}

export default function SettingsStep({ courseData, setCourseData }: SettingsStepProps) {
    const [formData, setFormData] = useState<SettingsFormData>({
        status: "draft",
    })
    const mutation = useUpdateCourseMutation()

    const handleSwitchChange = (field: keyof SettingsFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await mutation.execute({
            id: courseData.id,
            data: { status: formData.status === "published" ? "draft" : "published" },
        })

        if (updatedCourseData?.data) {
            toast.success("Course settings saved successfully")
            setCourseData(updatedCourseData.data as unknown as CourseLandingResponse)
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
                            <Label htmlFor="status" className="text-base font-medium">
                                Publish Course
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Make this course available to students. You can unpublish it at any time.
                            </p>
                        </div>
                        <Switch
                            id="status"
                            checked={formData.status === "published"}
                            onCheckedChange={(checked) => handleSwitchChange("status", checked ? "published" : "draft")}
                        />
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Course Status</h4>
                        <p className="text-sm text-muted-foreground">
                            {formData.status === "published"
                                ? "Your course is published and visible to students."
                                : "Your course is in draft mode and not visible to students."}
                        </p>
                    </div>
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
