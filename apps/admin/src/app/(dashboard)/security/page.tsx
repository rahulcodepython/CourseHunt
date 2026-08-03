"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { PageHeader } from "@package/components/page-header";
import { StatCard } from "@package/components/stat-card";

const accessLogs = [
    { time: "10:42:18", user: "admin@coursehunt.com", action: "Login Successful", ip: "103.27.84.12", status: "success" },
    { time: "10:38:05", user: "priya.patel@example.com", action: "Login Failed", ip: "45.118.62.9", status: "failed" },
    { time: "10:15:44", user: "karan.mehta@example.com", action: "Course Updated", ip: "122.161.45.201", status: "success" },
    { time: "09:58:31", user: "unknown", action: "Access Denied", ip: "203.145.77.3", status: "blocked" },
];

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Security"
                subtitle="Monitor platform security and access activity"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Active Sessions" value="47" icon="IconLock" />
                <StatCard
                    title="Failed Logins (24h)"
                    value="12"
                    icon="IconBan"
                    iconClassName="text-red-600"
                />
                <StatCard title="Banned Users" value="5" icon="IconUser" />
                <StatCard
                    title="Security Alerts"
                    value="2"
                    icon="IconShield"
                    iconClassName="text-amber-500"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Access Logs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accessLogs.map((log) => (
                                <TableRow key={log.time + log.action}>
                                    <TableCell className="font-mono text-xs">{log.time}</TableCell>
                                    <TableCell className="font-mono text-xs">{log.user}</TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                                    <TableCell>
                                        {log.status === "success" ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400">Success</Badge>
                                        ) : log.status === "failed" ? (
                                            <Badge variant="destructive">Failed</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400">Blocked</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="IconInfoCircle" className="size-3.5" />
                Demo data shown. Integrate your security provider to view live access logs.
            </p>
        </div>
    );
}
