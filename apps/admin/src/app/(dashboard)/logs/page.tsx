"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@package/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useState } from "react";

const demoLogs = [
    { time: "2026-07-21 14:32:01", level: "INFO", source: "api", message: "User login successful", details: "john@example.com" },
    { time: "2026-07-21 14:30:45", level: "WARN", source: "web", message: "High memory usage detected", details: "78% of 8GB" },
    { time: "2026-07-21 14:28:12", level: "ERROR", source: "api", message: "Database connection timeout", details: "Retry 3/3 failed" },
    { time: "2026-07-21 14:25:00", level: "INFO", source: "tutor", message: "Course published", details: "React 101 by John" },
    { time: "2026-07-21 14:20:33", level: "ERROR", source: "payment", message: "Razorpay webhook failed", details: "Signature mismatch" },
];

const levelVariant: Record<string, "secondary" | "outline" | "destructive"> = {
    INFO: "secondary",
    WARN: "outline",
    ERROR: "destructive",
};

const levelClass: Record<string, string> = {
    INFO: "bg-blue-100 text-blue-800",
    WARN: "bg-yellow-100 text-yellow-800",
    ERROR: "",
};

export default function LogsPage() {
    const [search, setSearch] = useState("");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Logs</h1>
                    <p className="text-muted-foreground text-sm">Platform logs and error monitoring</p>
                </div>
                <Button variant="outline">
                    <Icon name="IconDownload" className="mr-1 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <Tabs defaultValue="application">
                <TabsList>
                    <TabsTrigger value="application">Application</TabsTrigger>
                    <TabsTrigger value="errors">Errors</TabsTrigger>
                    <TabsTrigger value="access">API Access</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                </TabsList>

                <TabsContent value="application" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Application Logs</CardTitle>
                                <div className="relative w-64">
                                    <Icon name="IconSearch" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search logs..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {demoLogs.map((log, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{log.time}</TableCell>
                                            <TableCell>
                                                <Badge variant={levelVariant[log.level] || "outline"} className={levelClass[log.level] || ""}>
                                                    {log.level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{log.source}</TableCell>
                                            <TableCell>{log.message}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{log.details}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="errors" className="mt-4">
                    <Card>
                        <CardContent className="text-center py-12 text-muted-foreground">
                            <Icon name="IconCheck" className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p>No error logs to display</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="access" className="mt-4">
                    <Card>
                        <CardContent className="text-center py-12 text-muted-foreground">
                            <Icon name="IconFileText" className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p>Access logs will appear here</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="auth" className="mt-4">
                    <Card>
                        <CardContent className="text-center py-12 text-muted-foreground">
                            <Icon name="IconFileText" className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p>Auth logs will appear here</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
