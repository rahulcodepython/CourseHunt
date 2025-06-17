import { getBaseUrl } from "@/action"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserType } from "@/types/user.type"
import { Mail } from "lucide-react"

// const users: UserType[] = [
//     {
//         _id: 1,
//         name: "John Doe",
//         email: "john.doe@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 2,
//         name: "Sarah Johnson",
//         email: "sarah.j@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 3,
//         name: "Mike Chen",
//         email: "mike.chen@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 4,
//         name: "Emily Davis",
//         email: "emily.davis@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 5,
//         name: "Alex Rodriguez",
//         email: "alex.r@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 6,
//         name: "Lisa Wang",
//         email: "lisa.wang@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 7,
//         name: "David Wilson",
//         email: "david.wilson@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 8,
//         name: "Jennifer Brown",
//         email: "jennifer.b@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 9,
//         name: "Robert Taylor",
//         email: "robert.taylor@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
//     {
//         _id: 10,
//         name: "Amanda Garcia",
//         email: "amanda.garcia@example.com",
//         avatar: "/placeholder.svg?height=40&width=40",
//     },
// ];

export default async function UsersPage() {
    const baseurl = await getBaseUrl()

    const response = await fetch(`${baseurl}/api/users/all`, {
        next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    const users: UserType[] = await response.json()


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
                    <div className="flex items-center gap-4 text-lg">
                        <div>Total Users</div>
                        <div className="font-bold">{users.length}</div>
                    </div>
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">ID: {user._id}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                {user.email}
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
