import { getBaseUrl } from "@/action"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    BarChart3,
    BookOpen,
    DollarSign,
    Home,
    Settings,
    Users,
    Video
} from "lucide-react"
import { cookies } from "next/headers"

interface DashboardResponseData {
    students: {
        _id: string;
        name: string;
        email: string;
        createdAt: Date;
        purchasedCourses: string[];
    }[];
    activeCourses: {
        _id: string;
        title: string;
        students: number;
        totalRevenue: number;
    }[];
    monthlyRevenue: number;
    totalRevenue: number;
}
const adminMenuItems = [
    { title: "Dashboard", url: "#", icon: Home, active: true },
    { title: "Courses", url: "#", icon: BookOpen },
    { title: "Students", url: "#", icon: Users },
    { title: "Analytics", url: "#", icon: BarChart3 },
    { title: "Revenue", url: "#", icon: DollarSign },
    { title: "Settings", url: "#", icon: Settings },
]

const recentCourses = [
    {
        id: 1,
        title: "React Fundamentals",
        instructor: "Sarah Johnson",
        students: 245,
        revenue: 12250,
        status: "Published",
        rating: 4.8,
    },
    {
        id: 2,
        title: "Advanced JavaScript",
        instructor: "Mike Chen",
        students: 189,
        revenue: 9450,
        status: "Published",
        rating: 4.9,
    },
    {
        id: 3,
        title: "Python for Beginners",
        instructor: "Alex Kumar",
        students: 156,
        revenue: 7800,
        status: "Draft",
        rating: 4.6,
    },
    {
        id: 4,
        title: "UI/UX Design Principles",
        instructor: "Emma Davis",
        students: 203,
        revenue: 10150,
        status: "Published",
        rating: 4.7,
    },
]

const recentStudents = [
    {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        courses: 3,
        joinDate: "Dec 10, 2024",
        status: "Active",
    },
    {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        courses: 2,
        joinDate: "Dec 9, 2024",
        status: "Active",
    },
    {
        id: 3,
        name: "Bob Wilson",
        email: "bob@example.com",
        courses: 1,
        joinDate: "Dec 8, 2024",
        status: "Inactive",
    },
]

export default async function Admin() {
    const baseurl = await getBaseUrl()

    const cookieStore = await cookies()

    const response = await fetch(`${baseurl}/api/dashboard/admin`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        },
    })

    const responseData: DashboardResponseData = await response.json()

    // console.log("Response Data:", responseData);

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Welcome Section */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Welcome to Admin Panel 🚀</h2>
                <p className="text-muted-foreground">Manage your courses, students, and track platform performance.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {responseData.students.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {responseData.activeCourses.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{responseData.monthlyRevenue}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{responseData.totalRevenue}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Course Management */}
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
                                                    <div className="font-medium">{course.title}</div>
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

                {/* Student Management */}
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