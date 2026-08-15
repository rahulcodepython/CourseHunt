"use client";


import { useAdminDashboardQuery } from "@/query-hooks/dashboard.api";
import type { AdminDashboard } from "@/schema/dashboard.types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";
import { topCoursesColumns } from "./columns-top-courses";
import { userGrowthColumns } from "./columns-user-growth";

export default function DashboardPage() {
  const { data: raw, isLoading } = useAdminDashboardQuery();

  if (isLoading || !raw?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Overview of platform performance"
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const d: AdminDashboard = raw.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of platform performance and growth"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={d.total_users.toLocaleString()}
          icon="users"
          description="Registered platform users"
        />
        <StatCard
          title="Active Courses"
          value={d.total_courses.toLocaleString()}
          icon="book"
          description="Courses currently available"
        />
        <StatCard
          title="Total Enrollments"
          value={d.total_enrollments.toLocaleString()}
          icon="shopping-cart"
          description="Cumulative enrollments"
        />
        <StatCard
          title="Total Revenue"
          value={formatINR(d.total_revenue || 0)}
          icon="currency-rupee"
          description="Lifetime platform revenue"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-base font-semibold tracking-tight">Top Courses</h3>
          <DataTable
            columns={topCoursesColumns}
            data={d.top_courses ?? []}
            showColumnToggle={false}
            showPagination={false}
            emptyText="No course data yet"
            emptyIcon="book"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold tracking-tight">User Growth</h3>
          <DataTable
            columns={userGrowthColumns}
            data={d.user_growth ?? []}
            showColumnToggle={false}
            showPagination={false}
            emptyText="No growth data yet"
            emptyIcon="users"
          />
        </div>
      </div>
    </div>
  );
}
