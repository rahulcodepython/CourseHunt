"use client";

import * as React from "react";
import { toast } from "sonner";
import { Icon } from "@/components/common/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "@/app/tutor/courses/course-form";
import { formatDate, formatINR } from "@/lib/utils/format";
import type { Course, AdminCourseDetail } from "@/schema/courses.types";

interface CourseAboutTabProps {
  course: Course | AdminCourseDetail;
  role: "admin" | "tutor";
  onDeleteRequest: () => void;
}

export function CourseAboutTab({
  course,
  role,
  onDeleteRequest,
}: CourseAboutTabProps) {
  return (
    <div className="space-y-6">
      {/* Metadata Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Metadata</CardTitle>
          <CardDescription>Technical specifications, identifiers, and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-3 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Course ID</span>
              <p className="font-mono text-xs break-all">{course.id}</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Slug</span>
              <p className="font-mono text-sm break-all">{course.slug}</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Publication Status</span>
              <p className="font-medium text-sm capitalize">{course.status}</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Language & Level</span>
              <p className="font-medium text-sm capitalize">
                {course.language} • {course.level}
              </p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Pricing Model</span>
              <p className="font-medium text-sm">
                {course.is_free ? "Free" : `${formatINR(course.final_price)} (Retail: ${formatINR(course.actual_price)})`}
              </p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Coupons</span>
              <p className="font-medium text-sm">{course.coupon_allowed ? "Allowed" : "Disabled"}</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Created</span>
              <p className="text-xs text-muted-foreground">{formatDate(course.created_at)}</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Last Updated</span>
              <p className="text-xs text-muted-foreground">{formatDate(course.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About this Course</CardTitle>
            <CardDescription>Course synopsis and overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Short Description</h4>
              <p className="text-muted-foreground">
                {course.short_description || "No short description provided."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Full Description</h4>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {course.long_description || "No full description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="check" className="size-4 text-primary" />
                What Students Will Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              {course.benefits && course.benefits.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {course.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Icon name="check" className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No learning benefits listed yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="info-circle" className="size-4 text-muted-foreground" />
                Requirements & Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {course.requirements && course.requirements.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="size-1.5 rounded-full bg-primary shrink-0 mt-2" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No prerequisites listed.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tutor Course Edit Form & Danger Zone */}
      {role === "tutor" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit Course Details</CardTitle>
              <CardDescription>
                Update title, descriptions, category, pricing, media, and learning objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm
                editingCourse={course as Course}
                onSuccess={() => {
                  toast.success("Course metadata updated successfully");
                }}
                hideCancel
              />
            </CardContent>
          </Card>

          <Card className="border-destructive/40 bg-destructive/5 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <Icon name="trash" className="size-5" />
                <CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
                <Badge variant="destructive" className="ml-auto text-xs font-semibold">
                  Irreversible
                </Badge>
              </div>
              <CardDescription className="text-destructive/80 mt-1">
                Destructive actions that cannot be recovered once executed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-destructive/20 bg-background/50 p-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Delete this Course</h4>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Once you delete this course, there is no going back. All chapters, lessons,
                    quizzes, resources, discussions, and associated enrollment records will be
                    permanently removed from the database.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteRequest}
                  className="shrink-0"
                >
                  <Icon name="trash" className="mr-1.5 size-4" />
                  Delete Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
