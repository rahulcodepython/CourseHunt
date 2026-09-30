"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>
          {isAdmin ? "Enrolled Users & Access" : "Enrolled Students"}
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "View enrolled accounts and manage course access permissions"
            : "View active students enrolled in this course"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EnrollmentAccessTable
          courseId={courseId}
          showAccessActions={isAdmin}
          emptyText={
            isAdmin
              ? "No users enrolled in this course yet"
              : "No students enrolled in this course yet"
          }
        />
      </CardContent>
    </Card>
  );
}
