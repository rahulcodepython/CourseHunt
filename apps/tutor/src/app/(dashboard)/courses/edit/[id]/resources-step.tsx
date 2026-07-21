"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import FileUpload from "@package/components/file-upload";
import { useState } from "react";

export function ResourcesStep({ course, courseId }: { course: any; courseId: string; onNext: () => void }) {
    const [resources, setResources] = useState<{ title: string; file_url: string }[]>(course.resources || []);

    return (
        <div className="space-y-6">
            {resources.map((res, i) => (
                <div key={i} className="space-y-2 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <Label>Resource {i + 1}</Label>
                        <Button variant="ghost" size="sm" onClick={() => setResources(resources.filter((_, j) => j !== i))}>
                            <Icon name="IconTrash" className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    <Input value={res.title} onChange={(e) => {
                        const next = [...resources]; next[i].title = e.target.value; setResources(next);
                    }} placeholder="Resource title" />
                    <FileUpload
                        label="Upload Resource"
                        field={`resource_${i}`}
                        accept="document"
                        value={{ url: resources[i]?.file_url || "", fileType: "document" }}
                        onChange={(field: string, url: string) => {
                            const next = [...resources]; next[i].file_url = url; setResources(next);
                        }}
                    />
                </div>
            ))}
            <Button variant="outline" onClick={() => setResources([...resources, { title: "", file_url: "" }])}>
                <Icon name="IconPlus" className="mr-1 h-3 w-3" /> Add Resource
            </Button>
        </div>
    );
}
