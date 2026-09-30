"use client";

import * as React from "react";
import { Icon } from "@/components/common/icon";
import { Card } from "@/components/ui/card";
import { formatDuration, formatINR } from "@/lib/utils/format";
import type { Course, AdminCourseDetail } from "@/schema/courses.types";

interface CourseStatCardsProps {
  course: Course | AdminCourseDetail;
}

export function CourseStatCards({ course }: CourseStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Enrolled Students</p>
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon name="users" className="size-4" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold tabular-nums">
            {(course.student_count ?? 0).toLocaleString()}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Active learners</p>
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Average Rating</p>
          <div className="rounded-md bg-amber-500/10 p-2 text-amber-500">
            <Icon name="star" className="size-4 fill-amber-500" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold tabular-nums">
              {(course.rating_avg ?? 0).toFixed(1)}
            </h3>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {(course.feedback_count ?? 0).toLocaleString()} reviews
          </p>
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Curriculum</p>
          <div className="rounded-md bg-blue-500/10 p-2 text-blue-500">
            <Icon name="hierarchy" className="size-4" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold tabular-nums">
            {course.total_lectures ?? 0}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDuration(course.total_duration_seconds ?? 0)} total content
          </p>
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Price & Access</p>
          <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
            <Icon name="currency-rupee" className="size-4" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold tabular-nums">
            {course.is_free ? "Free" : formatINR(course.final_price)}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {course.coupon_allowed ? "Coupons enabled" : "Standard pricing"}
          </p>
        </div>
      </Card>
    </div>
  );
}
