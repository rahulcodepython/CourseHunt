import { getBaseUrl } from "@/action"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserType } from "@/types/user.type"
import { cookies } from "next/headers"

export default async function UsersPage() {
    const baseurl = await getBaseUrl()

    const cookieStore = await cookies();

    const response = await fetch(`${baseurl}/api/users/all`, {
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        },
    })

    const users: UserType[] = await response.json()

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground mt-2">Manage and view all registered users</p>
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
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Enrolled Courses</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead>ZIP</TableHead>
                                    <TableHead>Phone</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar.url || "/placeholder.svg"} alt={user.name} />
                                                    <AvatarFallback>{`CV`}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">Email: {user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {
                                                    user.role === 'admin' ? (
                                                        <span className="text-white bg-green-600 rounded-full px-2 py-1 font-semibold">Admin</span>
                                                    ) : user.role === 'user' ? (
                                                        <span className="text-white bg-blue-600 rounded-full px-2 py-1 font-semibold">User</span>
                                                    ) : null
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {
                                                    new Date(user.createdAt).toLocaleDateString()
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.purchasedCourses}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 truncate">
                                                {user.address?.slice(0, 15) || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.city || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.country || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.zip || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.phone || 'N/A'}
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
