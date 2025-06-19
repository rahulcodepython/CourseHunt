import { getBaseUrl } from "@/action"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Play } from "lucide-react"
import { cookies } from "next/headers"
import Link from "next/link"

interface ResponseDataType {
    user: {
        name: string;
    };
    courses: {
        imageUrl: { url: string, fileType: string },
        title: string,
        completedLessons: number,
        totalLessons: number,
        _id: string
    }[];
    enrolledCourses: string[];
    completedLessons: number;
}

const Notices = [
    {
        id: "1",
        title: "New Course Available: Advanced React",
        description: "Explore the latest course on advanced React techniques and patterns.",
        date: "2023-10-01",
    },
    {
        id: "2",
        title: "Scheduled Maintenance",
        description: "Our platform will undergo maintenance on 2023-10-05 from 12:00 AM to 4:00 AM.",
        date: "2023-10-03",
    },
    {
        id: "3",
        title: "Certificate Updates",
        description: "Certificates for completed courses have been updated. Check your profile for details.",
        date: "2023-10-02",
    },
];

export default async function StudentDashboard() {
    const baseurl = await getBaseUrl()

    const cookieStore = await cookies()

    const response = await fetch(`${baseurl}/api/dashboard/user`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        },
    })

    const responseData: ResponseDataType = await response.json()

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Welcome Section */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Welcome back, {responseData.user.name}! 👋</h2>
                <p className="text-muted-foreground">You're making great progress. Keep up the excellent work!</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Courses</CardTitle>
                        <CardDescription>Continue your learning journey</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {
                            responseData.courses.map((course) => (
                                <div key={course._id} className="flex items-center gap-4 rounded-lg border p-4">
                                    <img
                                        src={course.imageUrl?.url || "/placeholder.svg"}
                                        alt={course.title}
                                        className="h-16 w-24 rounded object-cover"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium">{course.title}</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>
                                                    {course.completedLessons}/{course.totalLessons} lessons
                                                </span>
                                                <span>{(course.completedLessons / course.totalLessons * 100).toFixed(2)}%</span>
                                            </div>
                                            <Progress value={(course.completedLessons / course.totalLessons * 100)} className="h-2" />
                                        </div>
                                        <div className="w-full flex justify-end">
                                            <Link href={`/study/${course._id}`}>
                                                <Button size="sm">
                                                    <Play className="h-3 w-3 mr-1" />
                                                    Continue
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="flex flex-col justify-between">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {responseData.enrolledCourses}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col justify-between">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {responseData.completedLessons}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col justify-between">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Certificates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    0
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notices</CardTitle>
                            <CardDescription>
                                Stay updated with the latest announcements and course updates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {
                                Notices.map((notice) => (
                                    <div key={notice.id} className="flex items-center space-x-4 rounded-lg border p-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium">{notice.title}</h3>
                                                <span className="text-sm text-gray-500">{notice.date}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {notice.description}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            }
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
