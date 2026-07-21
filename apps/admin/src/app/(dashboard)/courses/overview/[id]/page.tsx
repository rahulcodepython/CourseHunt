"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@package/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useParams } from "next/navigation";
import { useCourseLandingQuery } from "@package/query-hooks/courses.api";
import Loading from "@package/components/loading";

const dailyRevenue = [
    { day: "Mon", revenue: 12000, enrollments: 8 },
    { day: "Tue", revenue: 18000, enrollments: 12 },
    { day: "Wed", revenue: 14000, enrollments: 9 },
    { day: "Thu", revenue: 22000, enrollments: 15 },
    { day: "Fri", revenue: 16000, enrollments: 11 },
    { day: "Sat", revenue: 28000, enrollments: 18 },
    { day: "Sun", revenue: 20000, enrollments: 14 },
];

const monthlyRevenue = [
    { month: "Jan", revenue: 45000, enrollments: 30 },
    { month: "Feb", revenue: 52000, enrollments: 35 },
    { month: "Mar", revenue: 48000, enrollments: 32 },
    { month: "Apr", revenue: 61000, enrollments: 40 },
    { month: "May", revenue: 55000, enrollments: 36 },
    { month: "Jun", revenue: 72000, enrollments: 48 },
];

export default function CourseOverviewPage() {
    const params = useParams();
    const courseId = params.id as string;
    const { data: raw, isLoading } = useCourseLandingQuery(courseId);
    const course = raw?.data;

    if (isLoading) return <Loading />;
    if (!course) return <div className="text-center py-20 text-muted-foreground">Course not found</div>;

    const stats = [
        { label: "Total Enrolled", value: "142", icon: "IconUsers" },
        { label: "Total Revenue", value: "₹1,85,000", icon: "IconCurrencyRupee" },
        { label: "Average Rating", value: "4.6", icon: "IconStar" },
        { label: "Completion Rate", value: "68%", icon: "IconPercentage" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{course.title}</h1>
                    <Badge>{(course as any).status || "active"}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">by {course.instructor?.name || "Unknown"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <Card key={s.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                            <Icon name={s.icon as any} className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{s.value}</div>
                        </CardContent>
                    </Card>
                ))}
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
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </TabsContent>
                        <TabsContent value="monthly" className="mt-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </TabsContent>
                        <TabsContent value="enrollment" className="mt-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
