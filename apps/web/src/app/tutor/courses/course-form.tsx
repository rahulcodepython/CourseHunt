"use client";

import React, { useState, useEffect } from "react";

import { useCreateCourseMutation, useUpdateCourseMutation } from "@/query-hooks/courses.api";
import { useCategoriesQuery } from "@/query-hooks/categories.api";
import type { Course } from "@/schema/courses.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LoadingButton } from "@/components/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const NO_CATEGORY = "none";

const courseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  level: z.string().min(1, "Level is required"),
  status: z.string().min(1, "Status is required"),
  categoryId: z.string(),
  actual_price: z.string().optional(),
  final_price: z.string().optional(),
  benefits: z.string().optional(),
  requirements: z.string().optional(),
  image_url: z.string().optional(),
  preview_video_url: z.string().optional(),
  coupon_allowed: z.boolean(),
});

type CourseFormData = z.infer<typeof courseSchema>;

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CourseForm({
  editingCourse,
  onSuccess,
}: {
  editingCourse: Course | null;
  onSuccess: () => void;
}) {
  const createMutation = useCreateCourseMutation();
  const updateMutation = useUpdateCourseMutation();
  const { data: rawCategories } = useCategoriesQuery();
  const categories = (rawCategories?.data as any) ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      short_description: "",
      long_description: "",
      language: "English",
      level: "beginner",
      status: "draft",
      categoryId: NO_CATEGORY,
      actual_price: "",
      final_price: "",
      benefits: "",
      requirements: "",
      image_url: "",
      preview_video_url: "",
      coupon_allowed: true,
    },
  });

  useEffect(() => {
    if (editingCourse) {
      reset({
        title: editingCourse.title || "",
        short_description: editingCourse.short_description ?? "",
        long_description: editingCourse.long_description ?? "",
        language: editingCourse.language || "English",
        level: editingCourse.level || "beginner",
        status: editingCourse.status || "draft",
        categoryId: NO_CATEGORY,
        actual_price: editingCourse.actual_price ? String(editingCourse.actual_price) : "",
        final_price: editingCourse.final_price ? String(editingCourse.final_price) : "",
        benefits: (editingCourse.benefits ?? []).join("\n"),
        requirements: (editingCourse.requirements ?? []).join("\n"),
        image_url: editingCourse.image_url ?? "",
        preview_video_url: editingCourse.preview_video_url ?? "",
        coupon_allowed: editingCourse.coupon_allowed ?? true,
      });
    }
  }, [editingCourse, reset]);

  const onSubmit = async (form: CourseFormData) => {
    if (editingCourse) {
      await updateMutation.execute({
        id: editingCourse.id,
        data: {
          title: form.title.trim(),
          short_description: (form.short_description ?? "").trim() || null,
          long_description: (form.long_description ?? "").trim() || null,
          language: form.language,
          level: form.level,
          status: form.status,
          actual_price: form.actual_price ? Number(form.actual_price) : undefined,
          final_price: form.final_price ? Number(form.final_price) : undefined,
          benefits: splitLines(form.benefits ?? ""),
          requirements: splitLines(form.requirements ?? ""),
          image_url: (form.image_url ?? "").trim() || null,
          preview_video_url: (form.preview_video_url ?? "").trim() || null,
          coupon_allowed: form.coupon_allowed,
        },
      });
    } else {
      await createMutation.execute({
        title: form.title.trim(),
        short_description: (form.short_description ?? "").trim() || null,
        language: form.language,
        level: form.level,
        status: form.status,
        category_id: form.categoryId !== NO_CATEGORY ? form.categoryId : null,
      });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="course-title">Title</Label>
        <Input
          id="course-title"
          {...register("title")}
          placeholder="e.g. React for Beginners"
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="course-short">Short Description</Label>
        <Textarea
          id="course-short"
          {...register("short_description")}
          placeholder="One-line pitch for the course"
          rows={2}
        />
      </div>

      {editingCourse && (
        <div className="space-y-1.5">
          <Label htmlFor="course-long">Long Description</Label>
          <Textarea
            id="course-long"
            {...register("long_description")}
            placeholder="Full course description"
            rows={4}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>None</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="course-language">Language</Label>
          <Input
            id="course-language"
            {...register("language")}
            placeholder="English"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Level</Label>
          <Controller
            control={control}
            name="level"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {editingCourse && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-actual">Actual Price</Label>
              <Input
                id="course-actual"
                type="number"
                min={0}
                {...register("actual_price")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-final">Final Price</Label>
              <Input
                id="course-final"
                type="number"
                min={0}
                {...register("final_price")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-image">Image URL</Label>
              <Input
                id="course-image"
                {...register("image_url")}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-preview">Preview Video URL</Label>
              <Input
                id="course-preview"
                {...register("preview_video_url")}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-benefits">Benefits (one per line)</Label>
            <Textarea
              id="course-benefits"
              {...register("benefits")}
              placeholder="Learn by building real projects"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-requirements">Requirements (one per line)</Label>
            <Textarea
              id="course-requirements"
              {...register("requirements")}
              placeholder="Basic HTML knowledge"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Coupon Allowed</p>
              <p className="text-xs text-muted-foreground">Coupons can be applied to this course</p>
            </div>
            <Controller
              control={control}
              name="coupon_allowed"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {editingCourse ? "Save Changes" : "Create Course"}
        </LoadingButton>
      </div>
    </form>
  );
}