"use client";

import React, { useState, useEffect } from "react";

import { useCreateCouponMutation, useUpdateCouponMutation } from "@/query-hooks/coupons.api";
import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import type { Coupon } from "@/schema/coupons.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters"),
  discount_percent: z.number().min(1, "Discount must be at least 1%").max(100, "Discount cannot exceed 100%"),
  expires_at: z.string().optional(),
  max_usage: z.number().min(0),
  is_active: z.boolean(),
  courseId: z.string().min(1, "Please select a course"),
});

type CouponFormData = z.infer<typeof couponSchema>;

export function CouponForm({ editingCoupon, onSuccess }: { editingCoupon: Coupon | null; onSuccess: () => void }) {
  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();
  const { data: rawCourses } = useManageCoursesQuery({ limit: 100 });
  const courses = rawCourses?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_percent: 10,
      expires_at: "",
      max_usage: 100,
      is_active: true,
      courseId: "",
    },
  });

  useEffect(() => {
    if (editingCoupon) {
      reset({
        code: editingCoupon.code || "",
        discount_percent: editingCoupon.discount_percent || 0,
        expires_at: editingCoupon.expires_at?.split("T")[0] || "",
        max_usage: editingCoupon.max_usage || 0,
        is_active: editingCoupon.is_active ?? true,
        courseId: editingCoupon.course?.id ?? "",
      });
    }
  }, [editingCoupon, reset]);

  const onSubmit = async (form: CouponFormData) => {
    const data = {
      code: form.code.toUpperCase().replace(/\s+/g, ""),
      discount_percent: form.discount_percent,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : "",
      max_usage: form.max_usage || 0,
      is_active: form.is_active,
      ...(editingCoupon ? {} : { course_id: form.courseId }),
    };

    if (editingCoupon) {
      await updateMutation.execute({ id: editingCoupon.id, data });
    } else {
      await createMutation.execute(data);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="coupon-code">Coupon Code</Label>
        <Input
          id="coupon-code"
          {...register("code")}
          placeholder="e.g. SAVE50"
          className="font-mono uppercase tracking-wider"
        />
        {errors.code && (
          <p className="text-xs text-red-400">{errors.code.message}</p>
        )}
      </div>
      {!editingCoupon && (
        <div className="space-y-1.5">
          <Label>Course</Label>
          <Controller
            control={control}
            name="courseId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.courseId && (
            <p className="text-xs text-red-400">{errors.courseId.message}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="coupon-discount">Discount %</Label>
          <Input
            id="coupon-discount"
            type="number"
            min={1}
            max={100}
            {...register("discount_percent", { valueAsNumber: true })}
          />
          {errors.discount_percent && (
            <p className="text-xs text-red-400">{errors.discount_percent.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coupon-expiry">Expiry Date</Label>
          <Input
            id="coupon-expiry"
            type="date"
            {...register("expires_at")}
          />
        </div>
        {editingCoupon && (
          <div className="space-y-1.5">
            <Label htmlFor="coupon-usage">Current Usage</Label>
            <Input
              id="coupon-usage"
              value={editingCoupon.usage_count || 0}
              disabled
              className="bg-muted/30"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="coupon-max">Max Usage</Label>
          <Input
            id="coupon-max"
            type="number"
            min={0}
            placeholder="Unlimited"
            {...register("max_usage", { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">Coupon can be redeemed</p>
        </div>
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {editingCoupon ? "Save Changes" : "Create Coupon"}
        </LoadingButton>
      </div>
    </form>
  );
}