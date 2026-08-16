"use client";

import React from "react";

import { useCreateQuestionMutation, useUpdateQuestionMutation } from "@/query-hooks/quiz.api";
import type { QuizQuestionDetail } from "@/schema/quiz.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
        option_text: z.string(),
        is_correct: z.boolean(),
        sort_order: z.number(),
      }),
    ),
  arrange_items: z.array(
      z.object({
        item_text: z.string(),
        correct_order: z.number(),
      }),
    ),
  fill_answers: z.array(z.object({ value: z.string() })),
});

type QuestionFormData = z.infer<typeof questionSchema>;

const emptyDefaults: QuestionFormData = {
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
};

function buildDefaults(question?: QuizQuestionDetail | null): QuestionFormData {
  if (!question) return emptyDefaults;
  return {
    question_type: question.question_type,
    question_text: question.question_text,
    points: question.points,
    fill_blank_hint: question.fill_blank_hint ?? "",
    options: question.options?.length
      ? question.options.map((o, i) => ({
          option_text: o.option_text,
          is_correct: o.is_correct ?? false,
          sort_order: o.sort_order ?? i + 1,
        }))
      : emptyDefaults.options,
    // List position is the correct order now, so load items already sorted
    // by their previously-saved order.
    arrange_items: question.arrange_items?.length
      ? [...question.arrange_items]
          .sort((a, b) => a.correct_order - b.correct_order)
          .map((a) => ({ item_text: a.item_text, correct_order: a.correct_order }))
      : emptyDefaults.arrange_items,
    fill_answers: question.fill_answers?.length
      ? question.fill_answers.map((a) => ({ value: a.answer }))
      : emptyDefaults.fill_answers,
  };
}

export function QuestionForm({
  quizId,
  editingQuestion,
  onSuccess,
}: {
  quizId: string;
  editingQuestion?: QuizQuestionDetail | null;
  onSuccess: () => void;
}) {
  const createMutation = useCreateQuestionMutation();
  const updateMutation = useUpdateQuestionMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: buildDefaults(editingQuestion),
  });

  const questionType = watch("question_type");
  const optionValues = watch("options");
  const correctOptionIndex = optionValues.findIndex((o) => o.is_correct);

  const optionsField = useFieldArray<QuestionFormData, "options">({ control, name: "options" });
  const arrangeField = useFieldArray<QuestionFormData, "arrange_items">({ control, name: "arrange_items" });
  const fillField = useFieldArray<QuestionFormData, "fill_answers">({ control, name: "fill_answers" });

  // Reset to the question being edited (or a blank form) every time the dialog opens.
  React.useEffect(() => {
    reset(buildDefaults(editingQuestion));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingQuestion, reset]);

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
      // Correct order is purely the items' current list position — there's
      // no separate manual "order" value to fall back to anymore.
      payload.arrange_items = data.arrange_items.map((item, i) => ({
        item_text: item.item_text.trim(),
        correct_order: i + 1,
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

    if (editingQuestion) {
      await updateMutation.execute({ quizId, questionId: editingQuestion.id, data: payload as never });
    } else {
      await createMutation.execute({ quizId, data: payload as never });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          {(() => {
            const rows = optionsField.fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                {questionType === "single_choice" ? (
                  <RadioGroupItem value={String(index)} aria-label="Correct answer" />
                ) : (
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
                )}
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
            ));

            if (questionType !== "single_choice") {
              return <div className="space-y-2">{rows}</div>;
            }
            return (
              <RadioGroup
                value={correctOptionIndex >= 0 ? String(correctOptionIndex) : undefined}
                onValueChange={(val) => {
                  optionsField.fields.forEach((_, i) => setValue(`options.${i}.is_correct`, i === Number(val)));
                }}
                className="space-y-2"
              >
                {rows}
              </RadioGroup>
            );
          })()}
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => arrangeField.move(index, index - 1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                <Icon name="chevron-up" className="size-4" />
              </Button>
              <span className="w-5 shrink-0 text-center font-mono text-xs text-muted-foreground">
                {index + 1}
              </span>
              <Input
                placeholder={`Item ${index + 1}`}
                {...register(`arrange_items.${index}.item_text`)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => arrangeField.move(index, index + 1)}
                disabled={index === arrangeField.fields.length - 1}
                aria-label="Move down"
              >
                <Icon name="chevron-down" className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => arrangeField.remove(index)}
                aria-label="Remove item"
              >
                <Icon name="trash" className="size-4" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Use the arrows to arrange items in the correct order (1 = first).
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
        <LoadingButton type="submit" loading={isPending}>
          {editingQuestion ? "Save Changes" : "Add Question"}
        </LoadingButton>
      </div>
    </form>
  );
}