"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { DiscussionsTab } from "@/app/student/study/[courseId]/components/tabs/discussions-tab";

export function LessonDiscussionsView({ scope }: { scope: "admin" | "tutor" }) {
  const params = useParams<{ lessonId: string }>();

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-6">
        <DiscussionsTab
          lessonId={params.lessonId}
          scope={scope}
          canEditAny
          canDeleteAny
        />
      </CardContent>
    </Card>
  );
}
