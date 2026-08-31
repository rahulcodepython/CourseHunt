"use client";

import React, { useEffect } from "react";

import { useCreateQuizMutation } from "@/query-hooks/quiz.api";
import type { QuizMetadata } from "@/schema/quiz.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/loading-button";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const settingsSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  time_limit_seconds: z.number().min(0),
  pass_score_percent: z
    .number()
    .min(0, "Pass score must be between 0 and 100")
    .max(100, "Pass score must be between 0 and 100"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function QuizSettingsForm({
  lessonId,
  metadata,
  onSuccess,
}: {
  lessonId: string;
  metadata: QuizMetadata | null;
  onSuccess?: () => void;
}) {
  const createMutation = useCreateQuizMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      title: metadata?.title ?? "",
      time_limit_seconds: metadata?.time_limit_seconds ?? 0,
      pass_score_percent: metadata?.pass_score_percent ?? 70,
    },
  });

  useEffect(() => {
    reset({
      title: metadata?.title ?? "",
      time_limit_seconds: metadata?.time_limit_seconds ?? 0,
      pass_score_percent: metadata?.pass_score_percent ?? 70,
    });
  }, [metadata, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    const res = await createMutation.execute({
      lessonId,
      data: {
        title: data.title.trim(),
        time_limit_seconds: data.time_limit_seconds || 0,
        pass_score_percent: data.pass_score_percent,
      },
    });
    if (res?.success) onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="quiz-title">Quiz Title</Label>
        <Input id="quiz-title" placeholder="e.g. Chapter 1 Assessment" {...register("title")} />
        {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quiz-time">Time Limit (seconds)</Label>
        <Input
          id="quiz-time"
          type="number"
          min={0}
          placeholder="0 = no limit"
          {...register("time_limit_seconds", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quiz-pass">Pass Score (%)</Label>
        <Input
          id="quiz-pass"
          type="number"
          min={0}
          max={100}
          {...register("pass_score_percent", { valueAsNumber: true })}
        />
        {errors.pass_score_percent && (
          <p className="text-xs text-red-400">{errors.pass_score_percent.message}</p>
        )}
      </div>
      <div className="flex justify-end">
        <LoadingButton type="submit" loading={createMutation.isPending}>
          {metadata ? "Update Quiz Settings" : "Create Quiz"}
        </LoadingButton>
      </div>
    </form>
  );
}
