"use client";

import Link from "next/link";

import { useUserDashboardQuery } from "@/query-hooks/dashboard.api";
import { useEnrolledCoursesQuery } from "@/query-hooks/courses.api";
import type { UserDashboard } from "@/schema/dashboard.types";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@/components/common/icon";
import { formatDate } from "@/lib/utils/format";

export default function StudentDashboardPage() {
  const { data: raw, isLoading } = useUserDashboardQuery();
  const { data: rawEnrolled, isLoading: isLoadingEnrolled } = useEnrolledCoursesQuery();

  const enrolled = rawEnrolled?.data ?? [];
  const inProgress = enrolled.filter((c) => c.completion_percent < 100).slice(0, 4);

  if (isLoading || !raw) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Your learning at a glance" />
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
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
    );
  }

  const d: UserDashboard = (raw as any)?.data ?? raw;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your learning at a glance" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Enrolled Courses"
          value={(d?.enrolled_courses_count ?? 0).toLocaleString()}
          icon="book"
        />
        <StatCard
          title="Completed"
          value={(d?.completed_courses_count ?? 0).toLocaleString()}
          icon="check"
          iconClassName="text-green-600"
        />
        <StatCard
          title="In Progress"
          value={(d?.in_progress_courses_count ?? 0).toLocaleString()}
          icon="clock"
          iconClassName="text-amber-600"
        />
        <StatCard
          title="Certificates"
          value={(d?.certificates_count ?? 0).toLocaleString()}
          icon="user-check"
          iconClassName="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Continue Learning</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/learn">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingEnrolled ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : inProgress.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-10 text-center">
                <Icon name="book" className="size-8 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No courses in progress yet.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {inProgress.map((course) => {
                  const href = course.last_accessed_lesson_id
                    ? `/student/study/${course.id}?lessonId=${course.last_accessed_lesson_id}`
                    : `/student/study/${course.id}`;
                  return (
                    <Link
                      key={course.id}
                      href={href}
                      className="group flex items-center gap-4 rounded-md border p-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                    >
                      <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:opacity-90">
                        {course.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={course.image_url}
                            alt={course.title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <Icon name="book" className="size-5 opacity-40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                          {course.title}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={course.completion_percent} className="h-1.5" />
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {Math.round(course.completion_percent)}%
                          </span>
                        </div>
                      </div>
                      <Icon
                        name="chevron-right"
                        className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Certificates</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/certificates">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {d.recent_certificates.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center">
                <Icon name="user-check" className="size-8 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No certificates earned yet.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.recent_certificates.map((cert, i) => (
                      <TableRow key={i}>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {cert.course_title}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(cert.issued_at)}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Icon name="check" className="size-3" />
                            Verified
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/student/certificates">
                              View
                              <Icon name="chevron-right" className="ml-1 size-3.5" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
