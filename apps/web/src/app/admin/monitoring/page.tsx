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
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { monitoringColumns, type SystemEventLog } from "./columns";

const initialServices = [
  { name: "API Backend", uptime: "99.98%", response: "42ms", operational: true },
  { name: "Web Application", uptime: "99.99%", response: "38ms", operational: true },
  { name: "Tutor Portal", uptime: "99.95%", response: "51ms", operational: true },
  { name: "Database Service", uptime: "99.97%", response: "22ms", operational: true },
  { name: "Image CDN", uptime: "100%", response: "18ms", operational: true },
  { name: "Payment Gateway", uptime: "99.82%", response: "120ms", operational: false },
];

const mockEvents: SystemEventLog[] = [
  {
    id: "evt_1",
    date: "2026-08-11",
    time: "14:22:05",
    service: "API Backend",
    event: "CPU Spike > 92%",
    duration: "4m 12s",
    status: "resolved",
  },
  {
    id: "evt_2",
    date: "2026-08-10",
    time: "09:15:30",
    service: "Payment Gateway",
    event: "Gateway Timeout / Service Down",
    duration: "18m 45s",
    status: "investigating",
  },
  {
    id: "evt_3",
    date: "2026-08-08",
    time: "03:00:12",
    service: "Database Service",
    event: "Memory Spike & Auto-Restart",
    duration: "1m 30s",
    status: "resolved",
  },
  {
    id: "evt_4",
    date: "2026-08-05",
    time: "21:40:00",
    service: "Image CDN",
    event: "Origin Bandwidth Surge",
    duration: "12m 00s",
    status: "resolved",
  },
  {
    id: "evt_5",
    date: "2026-08-01",
    time: "11:05:19",
    service: "Tutor Portal",
    event: "High Disk I/O Wait",
    duration: "6m 20s",
    status: "warning",
  },
];

type TelemetryPoint = {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
};

const initialChartData: TelemetryPoint[] = Array.from({ length: 8 }).map((_, i) => ({
  time: `${i * 3}s ago`,
  cpu: 35 + Math.floor(Math.random() * 20),
  memory: 60 + Math.floor(Math.random() * 10),
  disk: 52 + Math.floor(Math.random() * 5),
}));

export default function MonitoringPage() {
  const [cpu, setCpu] = React.useState(42);
  const [memory, setMemory] = React.useState(68);
  const [disk, setDisk] = React.useState(55);
  const [chartData, setChartData] = React.useState<TelemetryPoint[]>(initialChartData);

  // Real-time telemetry simulation
  React.useEffect(() => {
    const interval = setInterval(() => {
      const newCpu = Math.min(Math.max(cpu + (Math.floor(Math.random() * 9) - 4), 25), 88);
      const newMemory = Math.min(Math.max(memory + (Math.floor(Math.random() * 5) - 2), 55), 85);
      const newDisk = Math.min(Math.max(disk + (Math.floor(Math.random() * 3) - 1), 50), 65);

      setCpu(newCpu);
      setMemory(newMemory);
      setDisk(newDisk);

      setChartData((prev) => [
        ...prev.slice(1),
        {
          time: "Just now",
          cpu: newCpu,
          memory: newMemory,
          disk: newDisk,
        },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [cpu, memory, disk]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        subtitle="System health, real-time resource telemetry charts, and incident history"
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
              </div>

              <div className="space-y-1.5 rounded-lg border p-2 bg-muted/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Disk</span>
                  <span className="font-mono font-bold">{disk}%</span>
                </div>
                <Progress value={disk} />
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
              5 / 6 Operational
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2 flex-1 flex flex-col justify-around">
            {initialServices.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-2.5 rounded-full shrink-0",
                      service.operational ? "bg-emerald-500" : "bg-destructive animate-pulse",
                    )}
                  />
                  <div>
                    <p className="font-medium leading-none">{service.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uptime {service.uptime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {service.response}
                  </span>
                  <Badge
                    variant={service.operational ? "secondary" : "destructive"}
                    className={service.operational ? "bg-emerald-500/10 text-emerald-500" : ""}
                  >
                    {service.operational ? "Operational" : "Down"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={monitoringColumns}
        data={mockEvents}
        searchPlaceholder="Search system events..."
        emptyIcon="activity"
        emptyText="No system events found"
      />
    </div>
  );
}
