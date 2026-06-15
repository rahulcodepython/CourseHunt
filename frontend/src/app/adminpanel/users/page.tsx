"use client";

import { Icon } from "@/components/icon";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Loading from "@/components/loading"
import { Button } from "@/components/ui/button"
import { useAdminUsersQuery, useBanUserMutation, useUnbanUserMutation, useSwitchUserRoleMutation, type AdminUserType } from "@/hooks/api"

import { useState } from "react"

export default function UsersPage() {
    const { data: users = [], isLoading } = useAdminUsersQuery()
    const { banUser, isPending: isBanning } = useBanUserMutation()
    const { unbanUser, isPending: isUnbanning } = useUnbanUserMutation()
    const switchRoleMutation = useSwitchUserRoleMutation()

    const [searchQuery, setSearchQuery] = useState("")

    const filteredUsers = (users || [])?.filter((user: AdminUserType) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    if (isLoading) return <Loading />

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Icon name="IconUserCog" className="w-8 h-8 text-primary" />
                            User Management
                        </h1>
                        <p className="text-muted-foreground mt-2">Manage and view all registered users</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Icon name="IconSearch" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="IconSearch by name or email..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[300px]">User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-center">Enrolled</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers?.map((user: AdminUserType) => (
                                        <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border">
                                                        <AvatarImage src={user.avatar?.url || "/placeholder.svg"} alt={user.name} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {user.name?.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm">{user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'admin' ? (
                                                        <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-none">Admin</Badge>
                                                    ) : user.role === 'tutor' ? (
                                                        <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-none">Tutor</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Student</Badge>
                                                    )}
                                                    {user.banned && <Badge variant="destructive">Banned</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="font-mono">
                                                    {user.purchasedCourses || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs max-w-[150px]">
                                                    <span className="truncate" title={user.address}>{user.address || 'No address'}</span>
                                                    <span className="text-muted-foreground">{user.city}{user.country ? `, ${user.country}` : ''}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {user.phone || 'No phone'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Icon name="IconDotsVertical" className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => switchRoleMutation.mutate({ id: user._id, role: user.role === 'tutor' ? 'student' : 'tutor' })}>
                                                            <Icon name="IconUserCheck" className="mr-2 h-5 w-5" />
                                                            {user.role === 'tutor' ? 'Make Student' : 'Make Tutor'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => switchRoleMutation.mutate({ id: user._id, role: user.role === 'admin' ? 'student' : 'admin' })}>
                                                            <Icon name="IconShield" className="mr-2 h-5 w-5" />
                                                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                        </DropdownMenuItem>
                                                        {user.banned ? (
                                                            <DropdownMenuItem onClick={() => unbanUser(user._id)} className="text-green-600">
                                                                <Icon name="IconShieldCheck" className="mr-2 h-5 w-5" />
                                                                Unban User
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => banUser(user._id)} className="text-destructive">
                                                                <Icon name="IconShieldExclamation" className="mr-2 h-5 w-5" />
                                                                Ban User
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No users found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
