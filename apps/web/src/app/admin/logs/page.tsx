"use client";

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/common/icon";
import { useSessionStore } from "@/store/session.store";

interface StructuredLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  http: {
    method: string;
    path: string;
    status_code: number;
    latency_ms: number;
    client_ip: string;
  };
  trace: {
    request_id: string;
    user_id?: string;
  };
  error?: {
    kind: string;
    stack_trace: string;
  };
}

export default function AdminObservabilityDashboard() {
  const [logs, setLogs] = useState<StructuredLog[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Poll Loki logs via backend proxy endpoint every 3 seconds
  useEffect(() => {
    if (!isLive) return;

    const pollLogs = async () => {
      try {
        const token = useSessionStore.getState().token;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(
          `/api/v1/admin/logs/loki/query?limit=50&level=${selectedLevel}`,
          {
            credentials: "include",
            headers,
          },
        );
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setLogs(json.data);
        }
      } catch (err) {
        console.error("Loki live poll failed", err);
      }
    };

    pollLogs();
    const interval = setInterval(pollLogs, 3000);
    return () => clearInterval(interval);
  }, [isLive, selectedLevel]);

  // Compute live metrics dynamically
  const errorCount = logs.filter((l) => l.level === "error" || l.http?.status_code >= 500).length;
  const errorRate = logs.length > 0 ? ((errorCount / logs.length) * 100).toFixed(2) : "0.00";
  const latencies = logs.map((l) => l.http?.latency_ms ?? 0).sort((a, b) => a - b);
  const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] ?? 0 : 0;
  const ingestionRate = (logs.length / 3).toFixed(1);

  // Transform logs into telemetry chart data
  const telemetryData = logs.slice(0, 20).reverse().map((l) => ({
    time: l.timestamp ? (l.timestamp.split("T")[1]?.slice(0, 8) ?? "") : "",
    latency: l.http?.latency_ms ?? 0,
    isError: l.level === "error" ? 1 : 0,
  }));

  const filteredLogs = logs.filter((l) => {
    const message = l.message ?? "";
    const path = l.http?.path ?? "";
    const reqId = l.trace?.request_id ?? "";
    const matchesSearch =
      search === "" ||
      message.toLowerCase().includes(search.toLowerCase()) ||
      path.toLowerCase().includes(search.toLowerCase()) ||
      reqId.includes(search);
    const matchesLevel = selectedLevel === "all" || l.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Observability & Live APM"
        subtitle="Live telemetry, stream analysis, and distributed log tracing powered by Loki"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
            >
              <Icon name={isLive ? "pause" : "play"} className="mr-1 size-4" />
              {isLive ? "Live Tailing" : "Paused"}
            </Button>
          </div>
        }
      />

      {/* Real-time Telemetry Metrics Header */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase font-semibold">Live Ingestion Rate</div>
            <div className="text-2xl font-bold mt-1">{ingestionRate} req/s</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase font-semibold">P95 Latency</div>
            <div className="text-2xl font-bold mt-1 text-emerald-500">{p95Latency} ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase font-semibold">5xx Error Rate</div>
            <div className="text-2xl font-bold mt-1 text-red-500">{errorRate} %</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase font-semibold">Active Workers</div>
            <div className="text-2xl font-bold mt-1">4 Nodes</div>
          </CardContent>
        </Card>
      </div>

      {/* Latency & Throughput Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Request Latency Profile (Live Stream)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <XAxis dataKey="time" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} unit="ms" />
                <Tooltip />
                <Area type="monotone" dataKey="latency" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* LogQL Filter Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Filter by path, message, or request ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          {["all", "info", "warn", "error"].map((lvl) => (
            <Button
              key={lvl}
              variant={selectedLevel === lvl ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel(lvl)}
            >
              {lvl.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Log Viewer with JSON Expansion */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No logs recorded yet. Incoming requests will appear here in real-time.
              </div>
            ) : (
              filteredLogs.map((log, idx) => {
                const rowKey = log.trace?.request_id ? `${log.trace.request_id}-${idx}` : `log-${idx}`;
                return (
                  <div key={rowKey} className="p-3 hover:bg-muted/50 transition">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setExpandedRow(expandedRow === rowKey ? null : rowKey)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{log.timestamp ? log.timestamp.slice(11, 19) : "--:--:--"}</span>
                        <Badge
                          variant={
                            log.level === "error"
                              ? "destructive"
                              : log.level === "warn"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {(log.level ?? "info").toUpperCase()}
                        </Badge>
                        <span className="font-semibold">{log.http?.method ?? "GET"}</span>
                        <span className="text-muted-foreground">{log.http?.path ?? "-"}</span>
                        <span className="font-bold">{log.http?.status_code ?? 200}</span>
                      </div>
                      <div className="text-muted-foreground">{log.http?.latency_ms ?? 0} ms</div>
                    </div>

                    {expandedRow === rowKey && (
                      <div className="mt-3 p-3 bg-muted rounded border overflow-x-auto text-[11px]">
                        <pre>{JSON.stringify(log, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
