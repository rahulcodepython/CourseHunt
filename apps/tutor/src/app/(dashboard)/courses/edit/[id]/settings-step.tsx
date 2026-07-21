"use client";

import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Label } from "@package/ui/label";
import { Switch } from "@package/ui/switch";
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api";
import { useState } from "react";

export function SettingsStep({ course, courseId }: { course: any; courseId: string; onNext: () => void }) {
    const updateMutation = useUpdateCourseMutation();
    const [published, setPublished] = useState(course.status === "published");

    const handleToggle = async () => {
        await updateMutation.execute({
            id: courseId,
            data: { status: published ? "draft" : "published" },
        });
        setPublished(!published);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base font-medium">Published</Label>
                            <p className="text-sm text-muted-foreground">
                                {published
                                    ? "This course is live and visible to students."
                                    : "This course is in draft mode and not visible to students."}
                            </p>
                        </div>
                        <Switch checked={published} onCheckedChange={handleToggle} />
                    </div>
                    <Button onClick={handleToggle} variant={published ? "destructive" : "default"}>
                        {published ? "Unpublish Course" : "Publish Course"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
