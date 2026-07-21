"use client";

import { Button } from "@package/ui/button";
import { CardContent } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { Textarea } from "@package/ui/textarea";
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api";
import FileUpload from "@package/components/file-upload";
import { useState } from "react";

export function BasicStep({ course, courseId, categories }: { course: any; courseId: string; categories: any[]; onNext: () => void }) {
    const updateMutation = useUpdateCourseMutation();
    const [form, setForm] = useState({
        title: course.title || "",
        category_id: course.category_id || "",
        description: course.description || "",
        language: course.language || "english",
        level: course.level || "beginner",
        image_url: course.image_url || "",
    });

    const handleSave = async () => {
        await updateMutation.execute({ id: courseId, data: form });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Course Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category_id} onValueChange={(v: string) => setForm({ ...form, category_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                            {categories.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={form.language} onValueChange={(v: string) => setForm({ ...form, language: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="hindi">Hindi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={form.level} onValueChange={(v: string) => setForm({ ...form, level: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Course Image</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Image URL" />
                <FileUpload
                    label="Upload Image"
                    field="image_url"
                    accept="image"
                    value={{ url: form.image_url, fileType: "image" }}
                    onChange={(field: string, url: string) => setForm({ ...form, image_url: url })}
                />
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
        </div>
    );
}
