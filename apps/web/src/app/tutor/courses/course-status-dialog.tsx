"use client";

import * as React from "react";

import { useUpdateCourseMutation } from "@/query-hooks/courses.api";
import type { Course } from "@/schema/courses.types";
import { COURSE_STATUS } from "@/lib/const";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingButton } from "@/components/loading-button";

const STATUS_OPTIONS = [
  { value: COURSE_STATUS.DRAFT, label: "Draft", description: "Only visible to you" },
  {
    value: COURSE_STATUS.PUBLISHED,
    label: "Published",
    description: "Live and visible to students",
  },
  {
    value: COURSE_STATUS.ARCHIVED,
    label: "Archived",
    description: "Hidden from students, kept for records",
  },
];

export function CourseStatusDialog({
  course,
  open,
  onOpenChange,
}: {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateCourseMutation();
  const [status, setStatus] = React.useState<string>(course?.status ?? COURSE_STATUS.DRAFT);

  React.useEffect(() => {
    if (open) setStatus(course?.status ?? COURSE_STATUS.DRAFT);
  }, [open, course]);

  const handleSave = async () => {
    if (!course) return;
    const res = await updateMutation.execute({ id: course.id, data: { status } });
    if (res?.success) onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Set Status · ${course?.title ?? ""}`}
      description="Control whether this course is visible to students"
    >
      <RadioGroup value={status} onValueChange={setStatus} className="gap-3 py-2">
        {STATUS_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 has-[[data-state=checked]]:border-primary"
          >
            <div>
              <p className="text-sm font-medium capitalize">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
            <RadioGroupItem value={option.value} />
          </label>
        ))}
      </RadioGroup>
      <DialogFooter className="mt-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={updateMutation.isPending}
        >
          Cancel
        </Button>
        <LoadingButton onClick={handleSave} loading={updateMutation.isPending}>
          Save
        </LoadingButton>
      </DialogFooter>
    </FormDialog>
  );
}
