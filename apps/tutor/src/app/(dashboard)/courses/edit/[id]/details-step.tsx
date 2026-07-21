"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api";
import { useState } from "react";

export function DetailsStep({ course, courseId }: { course: any; courseId: string; onNext: () => void }) {
    const updateMutation = useUpdateCourseMutation();
    const [description, setDescription] = useState(course.long_description || "");
    const [benefits, setBenefits] = useState<string[]>(course.benefits || [""]);
    const [requirements, setRequirements] = useState<string[]>(course.requirements || [""]);

    const handleSave = async () => {
        await updateMutation.execute({
            id: courseId,
            data: {
                long_description: description,
                benefits: benefits.filter(Boolean),
                requirements: requirements.filter(Boolean),
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Long Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
            </div>
            <div className="space-y-2">
                <Label>What You Will Learn</Label>
                {benefits.map((b, i) => (
                    <div key={i} className="flex gap-2">
                        <Input value={b} onChange={(e) => { const next = [...benefits]; next[i] = e.target.value; setBenefits(next); }} placeholder="e.g. Build real-world projects" />
                        <Button variant="ghost" size="sm" onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}>
                            <Icon name="IconX" className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setBenefits([...benefits, ""])}>
                    <Icon name="IconPlus" className="mr-1 h-3 w-3" /> Add Benefit
                </Button>
            </div>
            <div className="space-y-2">
                <Label>Requirements</Label>
                {requirements.map((r, i) => (
                    <div key={i} className="flex gap-2">
                        <Input value={r} onChange={(e) => { const next = [...requirements]; next[i] = e.target.value; setRequirements(next); }} placeholder="e.g. Basic JavaScript knowledge" />
                        <Button variant="ghost" size="sm" onClick={() => setRequirements(requirements.filter((_, j) => j !== i))}>
                            <Icon name="IconX" className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setRequirements([...requirements, ""])}>
                    <Icon name="IconPlus" className="mr-1 h-3 w-3" /> Add Requirement
                </Button>
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
        </div>
    );
}
