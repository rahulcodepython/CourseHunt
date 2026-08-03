"use client";

import { PageHeader } from "@package/components/page-header";
import { StatCard } from "@package/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@package/ui/table";
import { Skeleton } from "@package/ui/skeleton";
import { useAdminDashboardQuery } from "@package/query-hooks/dashboard.api";
import type { AdminDashboard, AdminTopCourse, UserGrowth } from "@package/schema/dashboard.types";
import { formatINR } from "@package/lib/format";

export default function AdminDashboardPage() {
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
                            <CardContent>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="mt-3 h-8 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-40 w-full" />
                            </CardContent>
                        </Card>
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
                    icon="IconUsers"
                    description="Registered platform users"
                />
                <StatCard
                    title="Active Courses"
                    value={d.total_courses.toLocaleString()}
                    icon="IconBook"
                    description="Courses currently available"
                />
                <StatCard
                    title="Total Enrollments"
                    value={d.total_enrollments.toLocaleString()}
                    icon="IconShoppingCart"
                    description="Cumulative enrollments"
                />
                <StatCard
                    title="Total Revenue"
                    value={formatINR(d.total_revenue || 0)}
                    icon="IconCurrencyRupee"
                    description="Lifetime platform revenue"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead className="text-right">Students</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {d.top_courses?.length ? d.top_courses.map((c: AdminTopCourse, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="max-w-[280px] truncate font-medium">{c.title}</TableCell>
                                        <TableCell className="text-right tabular-nums">{c.students.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">{formatINR(c.revenue || 0)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No course data yet</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Month</TableHead>
                                    <TableHead className="text-right">New Users</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {d.user_growth?.length ? d.user_growth.map((g: UserGrowth, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{g.month}</TableCell>
                                        <TableCell className="text-right tabular-nums">{g.count.toLocaleString()}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No growth data yet</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
