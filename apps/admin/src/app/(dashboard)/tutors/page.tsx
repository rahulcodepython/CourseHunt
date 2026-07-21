"use client";

import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@package/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useAdminProfilesQuery } from "@package/query-hooks/users.api";
import Loading from "@package/components/loading";

export default function TutorsPage() {
    const { data: raw, isLoading } = useAdminProfilesQuery();
    const tutors = raw?.data?.data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Tutors</h1>
                <p className="text-muted-foreground text-sm">Manage tutors and review applications</p>
            </div>

            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">All Tutors ({tutors.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending Approvals (0)</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Tutors</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="py-12"><Loading /></div>
                            ) : tutors.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">No tutors found</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tutor</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Headline</TableHead>
                                            <TableHead>Students</TableHead>
                                            <TableHead>Rating</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tutors.map((tutor) => (
                                            <TableRow key={tutor.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{tutor.name?.charAt(0) || "T"}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{tutor.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{tutor.email}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-48 truncate">
                                                    {tutor.headline || "—"}
                                                </TableCell>
                                                <TableCell>{tutor.total_students ?? 0}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Icon name="IconStar" className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                                        <span>{tutor.rating_avg?.toFixed(1) || "—"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm">
                                                            <Icon name="IconEye" className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-destructive">
                                                            <Icon name="IconBan" className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardContent className="text-center py-12 text-muted-foreground">
                            <Icon name="IconCheck" className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p>No pending tutor applications</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
