"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Calendar, DollarSign, TrendingUp, Users } from "lucide-react"
import { useState } from "react"
import { Bar, BarChart, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts"

const courseData = {
    id: 1,
    title: "Complete Web Development Bootcamp",
    instructor: "John Smith",
    totalEnrolled: 15420,
    totalRevenue: 1542000,
    averageRating: 4.8,
    completionRate: 78,
    status: "Active",
}

const dailySalesData = [
    { date: "Jan 1", sales: 12, revenue: 1188 },
    { date: "Jan 2", sales: 8, revenue: 792 },
    { date: "Jan 3", sales: 15, revenue: 1485 },
    { date: "Jan 4", sales: 20, revenue: 1980 },
    { date: "Jan 5", sales: 18, revenue: 1782 },
    { date: "Jan 6", sales: 25, revenue: 2475 },
    { date: "Jan 7", sales: 22, revenue: 2178 },
    { date: "Jan 8", sales: 30, revenue: 2970 },
    { date: "Jan 9", sales: 28, revenue: 2772 },
    { date: "Jan 10", sales: 35, revenue: 3465 },
    { date: "Jan 11", sales: 32, revenue: 3168 },
    { date: "Jan 12", sales: 40, revenue: 3960 },
    { date: "Jan 13", sales: 38, revenue: 3762 },
    { date: "Jan 14", sales: 45, revenue: 4455 },
]

const monthlySalesData = [
    { month: "Jan", sales: 450, revenue: 44550 },
    { month: "Feb", sales: 520, revenue: 51480 },
    { month: "Mar", sales: 480, revenue: 47520 },
    { month: "Apr", sales: 600, revenue: 59400 },
    { month: "May", sales: 750, revenue: 74250 },
    { month: "Jun", sales: 680, revenue: 67320 },
    { month: "Jul", sales: 820, revenue: 81180 },
    { month: "Aug", sales: 900, revenue: 89100 },
    { month: "Sep", sales: 850, revenue: 84150 },
    { month: "Oct", sales: 950, revenue: 94050 },
    { month: "Nov", sales: 1100, revenue: 108900 },
    { month: "Dec", sales: 1200, revenue: 118800 },
]

const yearlySalesData = [
    { year: "2020", sales: 2500, revenue: 247500 },
    { year: "2021", sales: 4200, revenue: 415800 },
    { year: "2022", sales: 6800, revenue: 673200 },
    { year: "2023", sales: 8900, revenue: 881100 },
    { year: "2024", sales: 12400, revenue: 1227600 },
]

const enrollmentData = [
    { period: "Week 1", enrolled: 120 },
    { period: "Week 2", enrolled: 150 },
    { period: "Week 3", enrolled: 180 },
    { period: "Week 4", enrolled: 200 },
    { period: "Week 5", enrolled: 170 },
    { period: "Week 6", enrolled: 220 },
    { period: "Week 7", enrolled: 250 },
    { period: "Week 8", enrolled: 280 },
]

export default function CourseStatsPage() {
    const [activeTab, setActiveTab] = useState("daily")

    const getSalesData = () => {
        switch (activeTab) {
            case "daily":
                return dailySalesData
            case "monthly":
                return monthlySalesData
            case "yearly":
                return yearlySalesData
            default:
                return dailySalesData
        }
    }

    const getChartConfig = () => {
        return {
            sales: {
                label: "Sales",
                color: "hsl(var(--chart-1))",
            },
            revenue: {
                label: "Revenue",
                color: "hsl(var(--chart-2))",
            },
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Course Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{courseData.title}</h1>
                            <p className="text-muted-foreground mt-2">Instructor: {courseData.instructor}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">{courseData.status}</Badge>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{courseData.totalEnrolled.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">+12% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${courseData.totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">+18% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{courseData.averageRating}/5</div>
                            <p className="text-xs text-muted-foreground">Based on 2,340 reviews</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{courseData.completionRate}%</div>
                            <p className="text-xs text-muted-foreground">+5% from last month</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Course Analytics</h2>
                        <TabsList>
                            <TabsTrigger value="daily" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Daily
                            </TabsTrigger>
                            <TabsTrigger value="monthly" className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Monthly
                            </TabsTrigger>
                            <TabsTrigger value="yearly" className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Yearly
                            </TabsTrigger>
                            <TabsTrigger value="enrollment" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Enrollment
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="daily" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Daily Sales</CardTitle>
                                    <CardDescription>Number of course sales per day</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={getChartConfig()}>
                                        <BarChart data={dailySalesData}>
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="sales" fill="var(--color-sales)" />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Daily Revenue</CardTitle>
                                    <CardDescription>Revenue generated per day</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={getChartConfig()}>
                                        <RechartsLineChart data={dailySalesData}>
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                                        </RechartsLineChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="monthly" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Monthly Sales</CardTitle>
                                    <CardDescription>Number of course sales per month</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={getChartConfig()}>
                                        <BarChart data={monthlySalesData}>
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="sales" fill="var(--color-sales)" />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Monthly Revenue</CardTitle>
                                    <CardDescription>Revenue generated per month</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={getChartConfig()}>
                                        <RechartsLineChart data={monthlySalesData}>
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                                        </RechartsLineChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="yearly" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Yearly Sales</CardTitle>
                                    <CardDescription>Number of course sales per year</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={getChartConfig()}>
                                        <BarChart data={yearlySalesData}>
                                            <XAxis dataKey="year" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="sales" fill="var(--color-sales)" />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Yearly Revenue</CardTitle>
                                    <CardDescription>Revenue generated per year</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={getChartConfig()}>
                                        <RechartsLineChart data={yearlySalesData}>
                                            <XAxis dataKey="year" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                                        </RechartsLineChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="enrollment" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Enrollment Trend</CardTitle>
                                <CardDescription>Weekly enrollment numbers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ enrolled: { label: "Enrolled", color: "hsl(var(--chart-3))" } }}>
                                    <RechartsLineChart data={enrollmentData}>
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="enrolled" stroke="var(--color-enrolled)" strokeWidth={2} />
                                    </RechartsLineChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
