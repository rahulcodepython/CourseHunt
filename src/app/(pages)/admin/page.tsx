"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/store/authStore"
import {
    BarChart3,
    BookOpen,
    DollarSign,
    Home,
    MoreHorizontal,
    Plus,
    Settings,
    Users,
    Video
} from "lucide-react"

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

export default function Admin() {
    const { isAuthenticated, user } = useAuthStore()

    console.log(isAuthenticated, user)
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
                        <div className="text-2xl font-bold">1,234</div>
                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground">+3 new this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231</div>
                        <p className="text-xs text-muted-foreground">+15% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">78%</div>
                        <p className="text-xs text-muted-foreground">+5% from last month</p>
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
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentCourses.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{course.title}</div>
                                                <div className="text-sm text-muted-foreground">by {course.instructor}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{course.students}</TableCell>
                                        <TableCell>${course.revenue.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={course.status === "Published" ? "default" : "secondary"}>
                                                {course.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit Course</DropdownMenuItem>
                                                    <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
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
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{student.name}</div>
                                                <div className="text-sm text-muted-foreground">{student.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{student.courses}</TableCell>
                                        <TableCell>{student.joinDate}</TableCell>
                                        <TableCell>
                                            <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                                                {student.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                                                    <DropdownMenuItem>View Progress</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Suspend Account</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button className="h-20 flex-col gap-2">
                            <Plus className="h-5 w-5" />
                            Create Course
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <Users className="h-5 w-5" />
                            Manage Students
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <BarChart3 className="h-5 w-5" />
                            View Analytics
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <Settings className="h-5 w-5" />
                            Platform Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
