"use client";

import { Icon } from "@package/components/icon";
import { useTutorDashboardQuery } from "@package/query-hooks/dashboard.api";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Skeleton } from "@package/ui/skeleton";
import type { TutorCourseStat } from "@package/schema/dashboard.types";

export default function TutorDashboard() {
    const { data: raw, isLoading } = useTutorDashboardQuery();
    const dashboard = raw?.data;

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-75" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-80 rounded-xl" />
            </div>
        );
    }

    if (!dashboard) return <div className="p-8">Failed to load dashboard.</div>;

    return (
        <div className="space-y-8 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 w-full">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Tutor Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your courses, students, and revenue.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full w-fit">
                    <Icon name="IconCalendar" className="w-5 h-5" />
                    {
                        new Date().toLocaleDateString(undefined, {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                        })
                    }
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                        <Icon name="IconBooks" className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard.total_courses}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {dashboard.published_courses} published, {dashboard.draft_courses} draft
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Icon name="IconUsers" className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard.total_students}</div>
                        <p className="text-xs text-muted-foreground mt-1">Enrolled across courses</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Icon name="IconCurrencyRupee" className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{dashboard.total_revenue}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rating</CardTitle>
                        <Icon name="IconStar" className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard.rating_avg.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Average rating</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Course Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {
                                dashboard.course_stats.map((stat: TutorCourseStat) => <div key={stat.course_id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{stat.title}</p>
                                        <p className="text-xs text-muted-foreground">{stat.students} students</p>
                                    </div>
                                </div>
                                )
                            }
                            {
                                dashboard.course_stats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No course data yet.</p>
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
