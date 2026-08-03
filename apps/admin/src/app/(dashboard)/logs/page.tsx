"use client";

import * as React from "react";
import { toast } from "sonner";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@package/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { PageHeader } from "@package/components/page-header";

const appLogs = [
    { timestamp: "2026-07-31 10:41:02", level: "INFO", source: "users-service", message: "User profile updated successfully", details: "user_id=usr_003" },
    { timestamp: "2026-07-31 10:35:18", level: "WARN", source: "payment-service", message: "Payment gateway response delayed", details: "latency=210ms" },
    { timestamp: "2026-07-31 10:22:47", level: "INFO", source: "course-service", message: "Course published", details: "course_id=crs_006" },
    { timestamp: "2026-07-31 09:58:31", level: "ERROR", source: "media-service", message: "Failed to upload file to ImageKit", details: "file=lecture_12.mp4" },
    { timestamp: "2026-07-31 09:41:05", level: "INFO", source: "auth-service", message: "Admin session refreshed", details: "user_id=adm_001" },
];

const levelBadge: Record<string, "secondary" | "outline" | "destructive"> = {
    INFO: "secondary",
    WARN: "outline",
    ERROR: "destructive",
};

const levelClass: Record<string, string> = {
    INFO: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
    WARN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
    ERROR: "",
};

function EmptyLogState({ icon, message }: { icon: "IconCheck" | "IconFileText"; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Icon name={icon} className="size-10 opacity-40" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

function ApplicationTab() {
    const [search, setSearch] = React.useState("");

    const filtered = appLogs.filter(
        (log) =>
            log.message.toLowerCase().includes(search.toLowerCase()) ||
            log.source.toLowerCase().includes(search.toLowerCase()) ||
            log.level.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Application Logs</CardTitle>
                <div className="relative">
                    <Icon
                        name="IconSearch"
                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 pl-9"
                    />
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
                        {filtered.map((log) => (
                            <TableRow key={log.timestamp}>
                                <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                                <TableCell>
                                    <Badge variant={levelBadge[log.level] || "outline"} className={levelClass[log.level] || ""}>
                                        {log.level}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{log.source}</TableCell>
                                <TableCell>{log.message}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{log.details}</TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No logs match your search
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function LogsPage() {
    const handleExport = () => {
        const csv = [
            "timestamp,level,source,message,details",
            ...appLogs.map((log) =>
                [log.timestamp, log.level, log.source, log.message, log.details]
                    .map((value) => `"${value}"`)
                    .join(","),
            ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "application-logs.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Logs exported as CSV");
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Logs"
                subtitle="View and export platform log entries"
                actions={
                    <Button onClick={handleExport}>
                        <Icon name="IconDownload" className="size-4" />
                        Export CSV
                    </Button>
                }
            />

            <Tabs defaultValue="application">
                <TabsList>
                    <TabsTrigger value="application">Application</TabsTrigger>
                    <TabsTrigger value="errors">Errors</TabsTrigger>
                    <TabsTrigger value="access">API Access</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                </TabsList>
                <TabsContent value="application">
                    <ApplicationTab />
                </TabsContent>
                <TabsContent value="errors">
                    <Card>
                        <CardContent className="p-0">
                            <EmptyLogState icon="IconCheck" message="No error logs to display" />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="access">
                    <Card>
                        <CardContent className="p-0">
                            <EmptyLogState icon="IconFileText" message="Access logs will appear here" />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="auth">
                    <Card>
                        <CardContent className="p-0">
                            <EmptyLogState icon="IconFileText" message="Auth logs will appear here" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
