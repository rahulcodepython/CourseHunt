"use client";

import * as React from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMonitoringQuery } from "@/query-hooks/monitoring.api";
import { useHealthQuery } from "@/query-hooks/health.api";

const POLL_INTERVAL_MS = 5 * 1000;
const CHART_WINDOW = 20;

type TelemetryPoint = {
    time: string;
    cpu: number;
    memory: number;
    disk: number;
};

function formatBytes(bytes: number): string {
    if (bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

const serviceLabels: Record<string, string> = {
    backend: "Backend API",
    postgres: "PostgreSQL Database",
    redis: "Redis Cache",
    minio: "MinIO Storage",
};

export default function MonitoringPage() {
    const { data: snapshotResp } = useMonitoringQuery(POLL_INTERVAL_MS);
    const { data: healthResp, isError: isHealthError } = useHealthQuery(POLL_INTERVAL_MS);
    const snapshot = snapshotResp?.data;
    const healthData = healthResp?.data;
    const [chartData, setChartData] = React.useState<TelemetryPoint[]>([]);

    React.useEffect(() => {
        if (!snapshot) return;
        setChartData((prev) => [
            ...prev.slice(-(CHART_WINDOW - 1)),
            {
                time: new Date().toLocaleTimeString(),
                cpu: Math.round(snapshot.telemetry.cpu_percent),
                memory: Math.round(snapshot.telemetry.memory_percent),
                disk: Math.round(snapshot.telemetry.disk_percent),
            },
        ]);
    }, [snapshot]);

    const cpu = chartData.at(-1)?.cpu ?? 0;
    const memory = chartData.at(-1)?.memory ?? 0;
    const disk = chartData.at(-1)?.disk ?? 0;

    const rawServices = snapshot?.services ?? healthData?.services ?? {};
    const serviceMap = {
        backend: isHealthError
            ? { status: "down", error: "Failed to connect to backend health API" }
            : { status: "up" },
        ...rawServices,
    };

    const services = Object.entries(serviceMap);
    const operationalCount = services.filter(([, s]) => s.status === "up").length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Monitoring"
                subtitle="Live host resource telemetry and dependent service health"
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
                <Card className="flex flex-col justify-between h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">
                            System Resource Telemetry
                        </CardTitle>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                            </span>
                            Live Feed
                        </span>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-between flex-1 space-y-4 pt-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5 rounded-lg border p-2 bg-muted/20">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-muted-foreground">CPU</span>
                                    <span className="font-mono font-bold">{cpu}%</span>
                                </div>
                                <Progress value={cpu} className={cpu > 80 ? "[&>div]:bg-destructive" : ""} />
                            </div>

                            <div className="space-y-1.5 rounded-lg border p-2 bg-muted/20">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-muted-foreground">Memory</span>
                                    <span className="font-mono font-bold">{memory}%</span>
                                </div>
                                <Progress value={memory} className="[&>div]:bg-amber-500" />
                                {snapshot && (
                                    <p className="text-[10px] text-muted-foreground">
                                        {formatBytes(snapshot.telemetry.memory_used_bytes)} / {formatBytes(snapshot.telemetry.memory_total_bytes)}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5 rounded-lg border p-2 bg-muted/20">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-muted-foreground">Disk</span>
                                    <span className="font-mono font-bold">{disk}%</span>
                                </div>
                                <Progress value={disk} />
                                {snapshot && (
                                    <p className="text-[10px] text-muted-foreground">
                                        {formatBytes(snapshot.telemetry.disk_used_bytes)} / {formatBytes(snapshot.telemetry.disk_total_bytes)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="w-full flex-1 min-h-[180px] pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--popover)",
                                            borderColor: "var(--border)",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cpu"
                                        name="CPU %"
                                        stroke="var(--primary)"
                                        fillOpacity={1}
                                        fill="url(#cpuGrad)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="memory"
                                        name="RAM %"
                                        stroke="#f59e0b"
                                        fillOpacity={1}
                                        fill="url(#memGrad)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-between h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">
                            Service Health Overview
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {operationalCount} / {services.length} Operational
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2.5 pt-2 flex-1 flex flex-col justify-around">
                        {services.map(([name, status]) => (
                            <div
                                key={name}
                                className="flex h-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            "size-2.5 rounded-full shrink-0",
                                            status.status === "up" ? "bg-emerald-500" : "bg-destructive animate-pulse",
                                        )}
                                    />
                                    <div>
                                        <p className="font-medium leading-none">{serviceLabels[name] ?? name}</p>
                                        {status.error && (
                                            <p className="text-xs text-muted-foreground mt-1">{status.error}</p>
                                        )}
                                    </div>
                                </div>
                                <Badge
                                    variant={status.status === "up" ? "secondary" : "destructive"}
                                    className={status.status === "up" ? "bg-emerald-500/10 text-emerald-500" : ""}
                                >
                                    {status.status === "up" ? "Operational" : "Down"}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
