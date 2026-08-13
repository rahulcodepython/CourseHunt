"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCourseLandingQuery } from "@/query-hooks/courses.api";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { StatCard } from "@/components/stat-card";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const dailyRevenue = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 5600 },
  { day: "Wed", revenue: 4800 },
  { day: "Thu", revenue: 7100 },
  { day: "Fri", revenue: 6400 },
  { day: "Sat", revenue: 8900 },
  { day: "Sun", revenue: 7600 },
];

const monthlyRevenue = [
  { month: "Jan", revenue: 82000 },
  { month: "Feb", revenue: 96000 },
  { month: "Mar", revenue: 110000 },
  { month: "Apr", revenue: 98000 },
  { month: "May", revenue: 124000 },
  { month: "Jun", revenue: 150000 },
];

const enrollments = [
  { month: "Jan", enrollments: 320 },
  { month: "Feb", enrollments: 415 },
  { month: "Mar", enrollments: 380 },
  { month: "Apr", enrollments: 470 },
  { month: "May", enrollments: 560 },
  { month: "Jun", enrollments: 690 },
];

const tooltipStyle = {
  borderRadius: "0.5rem",
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

export default function CourseOverviewPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id as string;
  const { data: raw, isLoading } = useCourseLandingQuery(courseId);
  const course = raw?.data;

  if (isLoading || !course) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/courses">
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Courses
            </span>
          </Link>
        </Button>
        <PageHeader
          title={course.title}
          subtitle={`Instructor: ${course.instructor?.name || "Unknown"}`}
          actions={
            <Badge variant={(course as any).status === "published" ? "default" : "secondary"}>
              {(course as any).status || "active"}
            </Badge>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Enrolled" value="142" icon="users" />
        <StatCard title="Total Revenue" value="₹1,85,000" icon="currency-rupee" />
        <StatCard title="Average Rating" value="4.6" icon="star" />
        <StatCard title="Completion Rate" value="68%" icon="percentage" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyRevenue}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                      "Revenue",
                    ]}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="monthly" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                      "Revenue",
                    ]}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="enrollment" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={enrollments}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: "var(--border)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/courses">
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Courses
            </span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
