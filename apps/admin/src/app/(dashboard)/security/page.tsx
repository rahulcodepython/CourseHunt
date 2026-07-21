"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";

const stats = [
    { label: "Active Sessions", value: "47", icon: "IconPlugConnected" },
    { label: "Failed Logins (24h)", value: "12", icon: "IconAlertTriangle" },
    { label: "Banned Users", value: "5", icon: "IconBan" },
    { label: "Security Alerts", value: "2", icon: "IconShieldExclamation" },
];

const recentLogs = [
    { time: "2 min ago", user: "john@example.com", action: "Failed login", ip: "192.168.1.1", status: "blocked" },
    { time: "15 min ago", user: "admin@coursehunt.com", action: "Role change", ip: "10.0.0.1", status: "success" },
    { time: "1 hour ago", user: "sarah@example.com", action: "Login", ip: "203.0.113.5", status: "success" },
    { time: "3 hours ago", user: "unknown", action: "Brute force attempt", ip: "198.51.100.2", status: "blocked" },
];

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Security</h1>
                <p className="text-muted-foreground text-sm">Monitor platform security, access logs, and threats</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <Card key={s.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                            <Icon name={s.icon as any} className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{s.value}</div>
                        </CardContent>
                    </Card>
                ))}
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
                            {recentLogs.map((log, i) => (
                                <TableRow key={i}>
                                    <TableCell className="text-sm text-muted-foreground">{log.time}</TableCell>
                                    <TableCell className="font-mono text-sm">{log.user}</TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                                    <TableCell>
                                        <Badge variant={log.status === "blocked" ? "destructive" : "secondary"} className={log.status === "success" ? "bg-green-100 text-green-800" : ""}>
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
