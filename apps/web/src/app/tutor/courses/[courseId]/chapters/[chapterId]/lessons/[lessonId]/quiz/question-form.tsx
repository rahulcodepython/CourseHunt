"use client";

import React from "react";

import { useCreateQuestionMutation } from "@/query-hooks/quiz.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoadingButton } from "@/components/loading-button";
import { Icon } from "@/components/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const questionSchema = z.object({
  question_type: z.string().min(1, "Question type is required"),
  question_text: z.string().min(1, "Question text is required"),
  points: z.number().min(1, "Points must be at least 1"),
  fill_blank_hint: z.string().optional(),
  options: z.array(
      z.object({
        option_text: z.string().min(1, "Option text is required"),
        is_correct: z.boolean(),
        sort_order: z.number(),
      }),
    ),
  arrange_items: z.array(
      z.object({
        item_text: z.string().min(1, "Item text is required"),
        correct_order: z.number().min(1),
      }),
    ),
  fill_answers: z.array(z.object({ value: z.string() })),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export function QuestionForm({
  quizId,
  onSuccess,
}: {
  quizId: string;
  onSuccess: () => void;
}) {
  const createMutation = useCreateQuestionMutation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_type: "single_choice",
      question_text: "",
      points: 1,
      fill_blank_hint: "",
      options: [
        { option_text: "", is_correct: false, sort_order: 1 },
        { option_text: "", is_correct: false, sort_order: 2 },
      ],
      arrange_items: [{ item_text: "", correct_order: 1 }],
      fill_answers: [{ value: "" }],
    },
  });

  const questionType = watch("question_type");

  const optionsField = useFieldArray<QuestionFormData, "options">({ control, name: "options" });
  const arrangeField = useFieldArray<QuestionFormData, "arrange_items">({ control, name: "arrange_items" });
  const fillField = useFieldArray<QuestionFormData, "fill_answers">({ control, name: "fill_answers" });

  // Ensure a fresh form every time the dialog reopens.
  React.useEffect(() => {
    reset({
      question_type: "single_choice",
      question_text: "",
      points: 1,
      fill_blank_hint: "",
      options: [
        { option_text: "", is_correct: false, sort_order: 1 },
        { option_text: "", is_correct: false, sort_order: 2 },
      ],
      arrange_items: [{ item_text: "", correct_order: 1 }],
      fill_answers: [{ value: "" }],
    });
  }, [reset]);

  const onSubmit = async (data: QuestionFormData) => {
    const payload: Record<string, unknown> = {
      question_type: data.question_type,
      question_text: data.question_text.trim(),
      points: data.points,
    };

    if (data.question_type === "fill_blank") {
      payload.fill_blank_hint = data.fill_blank_hint?.trim() || null;
      payload.fill_answers = data.fill_answers.map((a) => a.value.trim()).filter(Boolean);
    } else if (data.question_type === "arrange") {
      payload.arrange_items = data.arrange_items.map((item, i) => ({
        item_text: item.item_text.trim(),
        correct_order: item.correct_order || i + 1,
      }));
    } else {
      payload.options = data.options
        .filter((o) => o.option_text.trim())
        .map((o, i) => ({
          option_text: o.option_text.trim(),
          is_correct: o.is_correct,
          sort_order: o.sort_order || i + 1,
        }));
    }

    await createMutation.execute({ quizId, data: payload as never });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Question Type</Label>
          <Controller
            control={control}
            name="question_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">Single Choice</SelectItem>
                  <SelectItem value="multi_choice">Multiple Choice</SelectItem>
                  <SelectItem value="arrange">Arrange Order</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="question-points">Points</Label>
          <Input
            id="question-points"
            type="number"
            min={1}
            {...register("points", { valueAsNumber: true })}
          />
          {errors.points && <p className="text-xs text-red-400">{errors.points.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="question-text">Question</Label>
        <Input
          id="question-text"
          placeholder="Type the question..."
          {...register("question_text")}
        />
        {errors.question_text && <p className="text-xs text-red-400">{errors.question_text.message}</p>}
      </div>

      {(questionType === "single_choice" || questionType === "multi_choice") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Options{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {questionType === "single_choice" ? "mark one correct" : "mark one or more correct"}
              </span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                optionsField.append({ option_text: "", is_correct: false, sort_order: optionsField.fields.length + 1 })
              }
            >
              <Icon name="plus" className="size-3.5" />
              Add Option
            </Button>
          </div>
          {optionsField.fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Controller
                control={control}
                name={`options.${index}.is_correct`}
                render={({ field: correctField }) => (
                  <Switch
                    checked={correctField.value}
                    onCheckedChange={correctField.onChange}
                    aria-label="Correct answer"
                  />
                )}
              />
              <Input
                placeholder={`Option ${index + 1}`}
                {...register(`options.${index}.option_text`)}
                className="flex-1"
              />
              <input
                type="hidden"
                {...register(`options.${index}.sort_order`, { valueAsNumber: true })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => optionsField.remove(index)}
                disabled={optionsField.fields.length <= 2}
                aria-label="Remove option"
              >
                <Icon name="trash" className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {questionType === "arrange" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Arrange Items</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => arrangeField.append({ item_text: "", correct_order: arrangeField.fields.length + 1 })}
            >
              <Icon name="plus" className="size-3.5" />
              Add Item
            </Button>
          </div>
          {arrangeField.fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                placeholder={`Item ${index + 1}`}
                {...register(`arrange_items.${index}.item_text`)}
                className="flex-1"
              />
              <Input
                type="number"
                min={1}
                className="w-24"
                title="Correct order"
                placeholder="Order"
                {...register(`arrange_items.${index}.correct_order`, { valueAsNumber: true })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => arrangeField.remove(index)}
                aria-label="Remove item"
              >
                <Icon name="trash" className="size-4" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Enter the correct order (1 = first) for each item.
          </p>
        </div>
      )}

      {questionType === "fill_blank" && (
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="question-hint">Hint (optional)</Label>
            <Input
              id="question-hint"
              placeholder="A hint shown to students"
              {...register("fill_blank_hint")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Accepted Answers</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillField.append({ value: "" })}
            >
              <Icon name="plus" className="size-3.5" />
              Add Answer
            </Button>
          </div>
          {fillField.fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                placeholder={`Answer ${index + 1}`}
                {...register(`fill_answers.${index}.value`)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => fillField.remove(index)}
                aria-label="Remove answer"
              >
                <Icon name="trash" className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <LoadingButton type="submit" loading={createMutation.isPending}>
          Add Question
        </LoadingButton>
      </div>
    </form>
  );
}