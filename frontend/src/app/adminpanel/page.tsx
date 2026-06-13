"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminDashboardQuery } from "@/hooks/api"
import { IconBook, IconCurrencyDollar, IconUsers, IconVideo } from "@tabler/icons-react";

const Admin = () => {
    const { data: responseData, isLoading } = useAdminDashboardQuery()

    if (isLoading) return <div className="p-6">Loading dashboard...</div>
    if (!responseData) return <div className="p-6">Failed to load dashboard.</div>

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Welcome to Admin Panel 🚀</h2>
                <p className="text-muted-foreground">Manage your courses, students, and track platform performance.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {responseData.totalUsers}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <IconBook className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {responseData.totalCourses}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                        <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {responseData.totalEnrollments}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IconVideo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{responseData.totalRevenue}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Courses</CardTitle>
                        <CardDescription>Manage your course catalog</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead>Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    responseData.activeCourses.map((course) => (
                                        <TableRow key={course._id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium text-sm">{course.title}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{course.students}</TableCell>
                                            <TableCell>₹{course.totalRevenue}</TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Students</CardTitle>
                        <CardDescription>New student registrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Courses</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    responseData.students.map((student) => (
                                        <TableRow key={student._id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{student.name}</div>
                                                    <div className="text-sm text-muted-foreground">{student.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{student.purchasedCourses}</TableCell>
                                            <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Admin
