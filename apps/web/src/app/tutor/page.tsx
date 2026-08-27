"use client";

import { useTutorDashboardQuery } from "@/query-hooks/dashboard.api";
import type { TutorDashboard } from "@/schema/dashboard.types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";
import { courseStatsColumns } from "./columns-course-stats";

export default function TutorDashboardPage() {
  const { data: raw, isLoading } = useTutorDashboardQuery();

  if (isLoading || !raw?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tutor Dashboard"
          subtitle="Overview of your courses and student engagement"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="gap-4">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
    );
  }

  const d: TutorDashboard = raw.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutor Dashboard"
        subtitle="Overview of your teaching analytics and course revenue"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Courses"
          value={d.total_courses?.toLocaleString() ?? "0"}
          icon="book"
          description="Published & draft courses"
        />
        <StatCard
          title="Total Students"
          value={d.total_students?.toLocaleString() ?? "0"}
          icon="users"
          description="Enrolled in your courses"
        />
        <StatCard
          title="Total Earnings"
          value={formatINR(d.total_revenue || 0)}
          icon="currency-rupee"
          description="Net tutor revenue"
        />
        <StatCard
          title="Avg. Rating"
          value={d.rating_avg ? d.rating_avg.toFixed(1) : "N/A"}
          icon="user-check"
          description="Student feedback score"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">Per-Course Performance</h3>
        <DataTable
          columns={courseStatsColumns}
          data={d.course_stats ?? []}
          showColumnToggle={false}
          showPagination={false}
          emptyText="No course stats yet"
          emptyIcon="book"
        />
      </div>
    </div>
  );
}
