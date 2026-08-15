"use client";

import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { securityColumns, type AccessLog } from "./columns";

const accessLogs: AccessLog[] = [
  {
    time: "10:42:18",
    user: "admin@coursehunt.com",
    action: "Login Successful",
    ip: "103.27.84.12",
    status: "success",
  },
  {
    time: "10:38:05",
    user: "priya.patel@example.com",
    action: "Login Failed",
    ip: "45.118.62.9",
    status: "failed",
  },
  {
    time: "10:15:44",
    user: "karan.mehta@example.com",
    action: "Course Updated",
    ip: "122.161.45.201",
    status: "success",
  },
  {
    time: "09:58:31",
    user: "unknown",
    action: "Access Denied",
    ip: "203.145.77.3",
    status: "blocked",
  },
];

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        subtitle="Monitor platform security and access activity"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Sessions" value="47" icon="lock" />
        <StatCard
          title="Failed Logins (24h)"
          value="12"
          icon="ban"
          iconClassName="text-red-600"
        />
        <StatCard title="Banned Users" value="5" icon="user" />
        <StatCard
          title="Security Alerts"
          value="2"
          icon="shield"
          iconClassName="text-amber-500"
        />
      </div>

      <DataTable
        columns={securityColumns}
        data={accessLogs}
        searchPlaceholder="Search logs..."
        emptyIcon="shield"
        emptyText="No security logs found"
      />

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="info-circle" className="size-3.5" />
        Demo data shown. Integrate your security provider to view live access
        logs.
      </p>
    </div>
  );
}
