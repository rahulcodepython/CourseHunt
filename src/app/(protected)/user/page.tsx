"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, Clock, Home, Play, Settings, Star, Trophy, User, Video } from "lucide-react"

const studentMenuItems = [
    { title: "Dashboard", url: "#", icon: Home, active: true },
    { title: "My Courses", url: "#", icon: BookOpen },
    { title: "Schedule", url: "#", icon: Calendar },
    { title: "Achievements", url: "#", icon: Trophy },
    { title: "Profile", url: "#", icon: User },
    { title: "Settings", url: "#", icon: Settings },
]

const enrolledCourses = [
    {
        id: 1,
        title: "React Fundamentals",
        instructor: "Sarah Johnson",
        progress: 75,
        totalLessons: 24,
        completedLessons: 18,
        nextLesson: "State Management with Hooks",
        rating: 4.8,
        thumbnail: "/placeholder.svg?height=120&width=200",
    },
    {
        id: 2,
        title: "Advanced JavaScript",
        instructor: "Mike Chen",
        progress: 45,
        totalLessons: 32,
        completedLessons: 14,
        nextLesson: "Async/Await Patterns",
        rating: 4.9,
        thumbnail: "/placeholder.svg?height=120&width=200",
    },
    {
        id: 3,
        title: "UI/UX Design Principles",
        instructor: "Emma Davis",
        progress: 90,
        totalLessons: 18,
        completedLessons: 16,
        nextLesson: "Design Systems",
        rating: 4.7,
        thumbnail: "/placeholder.svg?height=120&width=200",
    },
]

const upcomingDeadlines = [
    { course: "React Fundamentals", task: "Final Project", dueDate: "Dec 15", priority: "high" },
    { course: "Advanced JavaScript", task: "Quiz 3", dueDate: "Dec 18", priority: "medium" },
    { course: "UI/UX Design", task: "Portfolio Review", dueDate: "Dec 20", priority: "low" },
]

const recentActivity = [
    { action: "Completed lesson", course: "React Fundamentals", time: "2 hours ago" },
    { action: "Started new course", course: "Advanced JavaScript", time: "1 day ago" },
    { action: "Earned certificate", course: "HTML & CSS Basics", time: "3 days ago" },
    { action: "Submitted assignment", course: "UI/UX Design", time: "5 days ago" },
]

export default function StudentDashboard() {
    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Welcome Section */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Welcome back, John! 👋</h2>
                <p className="text-muted-foreground">You're making great progress. Keep up the excellent work!</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">+1 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">48</div>
                        <p className="text-xs text-muted-foreground">+12 this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24.5</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Certificates</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2</div>
                        <p className="text-xs text-muted-foreground">Earned</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* My Courses */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Courses</CardTitle>
                            <CardDescription>Continue your learning journey</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {enrolledCourses.map((course) => (
                                <div key={course.id} className="flex items-center space-x-4 rounded-lg border p-4">
                                    <img
                                        src={course.thumbnail || "/placeholder.svg"}
                                        alt={course.title}
                                        className="h-16 w-24 rounded object-cover"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium">{course.title}</h3>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                <span className="text-xs text-muted-foreground">{course.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">by {course.instructor}</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>
                                                    {course.completedLessons}/{course.totalLessons} lessons
                                                </span>
                                                <span>{course.progress}%</span>
                                            </div>
                                            <Progress value={course.progress} className="h-2" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Next: {course.nextLesson}</p>
                                    </div>
                                    <Button size="sm">
                                        <Play className="h-3 w-3 mr-1" />
                                        Continue
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Content */}
                <div className="space-y-6">
                    {/* Upcoming Deadlines */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Deadlines</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcomingDeadlines.map((deadline, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{deadline.task}</p>
                                        <p className="text-xs text-muted-foreground">{deadline.course}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge
                                            variant={
                                                deadline.priority === "high"
                                                    ? "destructive"
                                                    : deadline.priority === "medium"
                                                        ? "default"
                                                        : "secondary"
                                            }
                                        >
                                            {deadline.dueDate}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="space-y-1">
                                    <p className="text-sm">{activity.action}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.course} • {activity.time}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
