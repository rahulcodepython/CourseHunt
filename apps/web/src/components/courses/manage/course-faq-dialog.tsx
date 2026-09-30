"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useCreateFaqMutation,
  useUpdateFaqMutation,
} from "@/query-hooks/faqs.api";
import type { Faq } from "@/schema/faqs.types";
import { FormDialog } from "@/components/dialogs/form-dialog";
import { LoadingButton } from "@/components/common/loading-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

const faqSchema = z.object({
  question: z.string().min(3, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});
type FaqFormData = z.infer<typeof faqSchema>;

export function CourseFaqDialog({
  open,
  onOpenChange,
  editing,
  courseId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Faq | null;
  courseId: string;
}) {
  const createMutation = useCreateFaqMutation(courseId);
  const updateMutation = useUpdateFaqMutation(courseId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: "", answer: "" },
  });

  React.useEffect(() => {
    if (open) {
      reset({ question: editing?.question ?? "", answer: editing?.answer ?? "" });
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: FaqFormData) => {
    if (editing) {
      await updateMutation.execute({ id: editing.id, data });
    } else {
      await createMutation.execute(data);
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit FAQ" : "Create FAQ"}
      description="Answer common questions students ask about this course"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="faq-question">Question</Label>
          <Input
            id="faq-question"
            placeholder="e.g. Do I get lifetime access?"
            {...register("question")}
          />
          {errors.question && <p className="text-xs text-red-500">{errors.question.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="faq-answer">Answer</Label>
          <Textarea
            id="faq-answer"
            rows={4}
            placeholder="Write the answer here..."
            {...register("answer")}
          />
          {errors.answer && <p className="text-xs text-red-500">{errors.answer.message}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? "Save Changes" : "Create"}
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}
