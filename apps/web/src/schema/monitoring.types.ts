import { z } from 'zod';

export const TelemetryZod = z.object({
    cpu_percent: z.number(),
    memory_used_bytes: z.number(),
    memory_total_bytes: z.number(),
    memory_percent: z.number(),
    disk_used_bytes: z.number(),
    disk_total_bytes: z.number(),
    disk_percent: z.number(),
    uptime_seconds: z.number(),
});
export type Telemetry = z.infer<typeof TelemetryZod>;

export const ServiceStatusZod = z.object({
    status: z.enum(["up", "down"]),
    error: z.string().optional(),
});

export const MonitoringSnapshotZod = z.object({
    telemetry: TelemetryZod,
    services: z.record(z.string(), ServiceStatusZod),
    all_healthy: z.boolean(),
});
export type MonitoringSnapshot = z.infer<typeof MonitoringSnapshotZod>;
