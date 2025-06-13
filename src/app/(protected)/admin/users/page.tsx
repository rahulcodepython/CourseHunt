import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User as UserType } from "@/types/user.type"
import { Calendar, Filter, Mail, Search, User } from "lucide-react"

const users: UserType[] = [
    {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        dateOfJoining: "2023-01-15",
        status: "Active",
        coursesEnrolled: 3,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        dateOfJoining: "2023-02-20",
        status: "Active",
        coursesEnrolled: 2,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 3,
        name: "Mike Chen",
        email: "mike.chen@example.com",
        dateOfJoining: "2023-03-10",
        status: "Active",
        coursesEnrolled: 5,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 4,
        name: "Emily Davis",
        email: "emily.davis@example.com",
        dateOfJoining: "2023-04-05",
        status: "Inactive",
        coursesEnrolled: 1,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 5,
        name: "Alex Rodriguez",
        email: "alex.r@example.com",
        dateOfJoining: "2023-05-12",
        status: "Active",
        coursesEnrolled: 4,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 6,
        name: "Lisa Wang",
        email: "lisa.wang@example.com",
        dateOfJoining: "2023-06-18",
        status: "Active",
        coursesEnrolled: 2,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 7,
        name: "David Wilson",
        email: "david.wilson@example.com",
        dateOfJoining: "2023-07-22",
        status: "Active",
        coursesEnrolled: 3,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 8,
        name: "Jennifer Brown",
        email: "jennifer.b@example.com",
        dateOfJoining: "2023-08-30",
        status: "Active",
        coursesEnrolled: 1,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 9,
        name: "Robert Taylor",
        email: "robert.taylor@example.com",
        dateOfJoining: "2023-09-14",
        status: "Inactive",
        coursesEnrolled: 2,
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 10,
        name: "Amanda Garcia",
        email: "amanda.garcia@example.com",
        dateOfJoining: "2023-10-08",
        status: "Active",
        coursesEnrolled: 6,
        avatar: "/placeholder.svg?height=40&width=40",
    },
];

export default function UsersPage() {
    const getStatusColor = (status: string) => {
        return status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground mt-2">Manage and view all registered users</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search users..." className="pl-10 w-64" />
                        </div>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.length}</div>
                            <p className="text-xs text-muted-foreground">+12% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <User className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.filter((u) => u.status === "Active").length}</div>
                            <p className="text-xs text-muted-foreground">+8% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">24</div>
                            <p className="text-xs text-muted-foreground">+18% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Courses</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">2.8</div>
                            <p className="text-xs text-muted-foreground">per user enrolled</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Date Joined</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Courses</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {new Date(user.dateOfJoining).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.coursesEnrolled} enrolled</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">
                                                    View
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    Edit
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
