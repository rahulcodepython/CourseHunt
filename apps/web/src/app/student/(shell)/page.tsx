"use client";

import Link from "next/link";

import { useUserDashboardQuery } from "@/query-hooks/dashboard.api";
import { useEnrolledCoursesQuery } from "@/query-hooks/courses.api";
import type { UserDashboard } from "@/schema/dashboard.types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { formatDate } from "@/lib/format";

export default function StudentDashboardPage() {
  const { data: raw, isLoading } = useUserDashboardQuery();
  const { data: rawEnrolled, isLoading: isLoadingEnrolled } = useEnrolledCoursesQuery();

  const enrolled = rawEnrolled?.data?.data ?? [];
  const inProgress = enrolled.filter((c) => c.completion_percent < 100).slice(0, 4);

  if (isLoading || !raw?.data) {
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

  const d: UserDashboard = raw.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your learning at a glance" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Enrolled Courses"
          value={d.enrolled_courses_count.toLocaleString()}
          icon="book"
        />
        <StatCard
          title="Completed"
          value={d.completed_courses_count.toLocaleString()}
          icon="check"
          iconClassName="text-green-600"
        />
        <StatCard
          title="In Progress"
          value={d.in_progress_courses_count.toLocaleString()}
          icon="clock"
          iconClassName="text-amber-600"
        />
        <StatCard
          title="Certificates"
          value={d.certificates_count.toLocaleString()}
          icon="user-check"
          iconClassName="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
              <div className="space-y-4">
                {inProgress.map((course) => (
                  <div key={course.id} className="flex items-center gap-4 rounded-md border p-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center text-muted-foreground">
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
                      <p className="truncate text-sm font-medium">{course.title}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={course.completion_percent} className="h-1.5" />
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {Math.round(course.completion_percent)}%
                        </span>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link
                        href={
                          course.last_accessed_lesson_id
                            ? `/student/study/${course.id}?lessonId=${course.last_accessed_lesson_id}`
                            : `/student/study/${course.id}`
                        }
                      >
                        Study
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            {d.recent_certificates.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center">
                <Icon name="user-check" className="size-8 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No certificates earned yet.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {d.recent_certificates.map((cert, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{cert.course_title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(cert.issued_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
