"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Progress } from "@package/ui/progress";
import { PageHeader } from "@package/components/page-header";
import { cn } from "@package/lib/utils";

const services = [
    { name: "API (Go Backend)", status: "up", uptime: "99.9%", responseTime: "45ms" },
    { name: "Web Application", status: "up", uptime: "99.8%", responseTime: "120ms" },
    { name: "Tutor Application", status: "up", uptime: "99.7%", responseTime: "115ms" },
    { name: "Database (PostgreSQL)", status: "up", uptime: "99.95%", responseTime: "5ms" },
    { name: "Image CDN", status: "up", uptime: "99.99%", responseTime: "30ms" },
    { name: "Payment Gateway", status: "up", uptime: "99.9%", responseTime: "200ms" },
];

export default function MonitoringPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Monitoring"
                subtitle="System health, resource usage and service status"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                CPU Usage
                            </span>
                            <Icon name="IconCpu" className="size-4 text-muted-foreground" />
                        </div>
                        <span className="text-2xl font-bold">42%</span>
                        <Progress value={42} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Memory Usage
                            </span>
                            <Icon name="IconDeviceFloppy" className="size-4 text-muted-foreground" />
                        </div>
                        <span className="text-2xl font-bold">68%</span>
                        <Progress value={68} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Disk Usage
                            </span>
                            <Icon name="IconDatabase" className="size-4 text-muted-foreground" />
                        </div>
                        <span className="text-2xl font-bold">55%</span>
                        <Progress value={55} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Service Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {services.map((service) => (
                        <div
                            key={service.name}
                            className="flex items-center justify-between rounded-lg border p-3"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        "size-2.5 rounded-full",
                                        service.status === "up" ? "bg-green-500" : "bg-red-500",
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{service.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        Uptime {service.uptime}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {service.responseTime}
                                </span>
                                <Badge
                                    variant={service.status === "up" ? "secondary" : "destructive"}
                                    className={service.status === "up" ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400" : ""}
                                >
                                    {service.status === "up" ? "Operational" : "Down"}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="IconInfoCircle" className="size-3.5" />
                Demo data shown. Connect your infrastructure provider for live monitoring.
            </p>
        </div>
    );
}
