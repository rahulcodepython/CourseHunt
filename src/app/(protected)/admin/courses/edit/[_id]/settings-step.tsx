"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, Save } from "lucide-react"
import { useState } from "react"

interface SettingsStepProps {
    onPrev: () => void
}

export default function SettingsStep({ onPrev }: SettingsStepProps) {
    const [formData, setFormData] = useState({
        isPublished: false,
    })

    const handleSwitchChange = (field: string, value: boolean) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const handleSaveAndFinish = () => {
        alert("Course saved successfully!")
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

                <div className="flex justify-between">
                    <Button variant="outline" onClick={onPrev}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <Button onClick={handleSaveAndFinish}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Course
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
