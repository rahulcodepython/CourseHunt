"use client";

import { Icon } from "@package/components/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useAdminDashboardQuery } from "@package/query-hooks/dashboard.api";
import type { AdminDashboard, AdminTopCourse, UserGrowth } from "@package/schema/dashboard.types";
import Loading from "@package/components/loading";

export default function AdminDashboardPage() {
    const { data: raw, isLoading } = useAdminDashboardQuery();

    if (isLoading) return <Loading />;
    if (!raw?.data) return <div className="text-center py-20 text-muted-foreground">Failed to load dashboard.</div>;

    const d: AdminDashboard = raw.data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground text-sm">Platform overview and key metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Icon name="IconUsers" className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{d.total_users}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <Icon name="IconBook" className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{d.total_courses}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                        <Icon name="IconShoppingCart" className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{d.total_enrollments}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Icon name="IconCurrencyRupee" className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{d.total_revenue?.toLocaleString() || "0"}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                        <TableCell className="font-medium">{c.title}</TableCell>
                                        <TableCell className="text-right">{c.students}</TableCell>
                                        <TableCell className="text-right">₹{c.revenue?.toLocaleString() || "0"}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No course data yet</TableCell>
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
                    <CardContent>
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
                                        <TableCell className="text-right">{g.count}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">No growth data yet</TableCell>
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
