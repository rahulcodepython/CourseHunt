"use client";

import * as React from "react";
import { EnrollmentAccessTable } from "@/components/table/enrollment-access-table";

export function CourseEnrollmentsPage({
  courseId,
  role,
}: {
  courseId: string;
  role: "admin" | "tutor";
}) {
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">
          {isAdmin ? "Enrolled Users & Access" : "Enrolled Students"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "View enrolled accounts and manage course access permissions"
            : "View active students enrolled in this course"}
        </p>
      </div>

      <EnrollmentAccessTable
        courseId={courseId}
        showAccessActions={isAdmin}
        emptyText={
          isAdmin
            ? "No users enrolled in this course yet"
            : "No students enrolled in this course yet"
        }
      />
    </div>
  );
}
