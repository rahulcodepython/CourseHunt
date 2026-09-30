"use client";

import * as React from "react";
import { toast } from "sonner";
import { Icon } from "@/components/common/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "@/app/tutor/courses/course-form";
import type { Course, AdminCourseDetail } from "@/schema/courses.types";

interface CourseSettingsTabProps {
  course: Course | AdminCourseDetail;
  role: "admin" | "tutor";
  onDeleteRequest: () => void;
}

export function CourseSettingsTab({
  course,
  role,
  onDeleteRequest,
}: CourseSettingsTabProps) {
  return (
    <div className="space-y-6">
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

      {role === "tutor" && (
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
      )}
    </div>
  );
}
