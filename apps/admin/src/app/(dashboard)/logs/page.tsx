"use client";

import * as React from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logsColumns, type LogEntry } from "./columns";

const appLogs: LogEntry[] = [
  {
    timestamp: "2026-07-31 10:41:02",
    level: "INFO",
    source: "users-service",
    message: "User profile updated successfully",
    details: "user_id=usr_003",
  },
  {
    timestamp: "2026-07-31 10:35:18",
    level: "WARN",
    source: "payment-service",
    message: "Payment gateway response delayed",
    details: "latency=210ms",
  },
  {
    timestamp: "2026-07-31 10:22:47",
    level: "INFO",
    source: "course-service",
    message: "Course published",
    details: "course_id=crs_006",
  },
  {
    timestamp: "2026-07-31 09:58:31",
    level: "ERROR",
    source: "media-service",
    message: "Failed to upload file to ImageKit",
    details: "file=lecture_12.mp4",
  },
  {
    timestamp: "2026-07-31 09:41:05",
    level: "INFO",
    source: "auth-service",
    message: "Admin session refreshed",
    details: "user_id=adm_001",
  },
];

const errorLogs: LogEntry[] = appLogs.filter((l) => l.level === "ERROR");

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
            <Icon name="download" className="size-4" />
            Export CSV
          </Button>
        }
      />

      <Tabs defaultValue="application" className="space-y-4">
        <TabsList>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="api">API Access</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="application">
          <DataTable
            columns={logsColumns}
            data={appLogs}
            searchPlaceholder="Search logs..."
            emptyIcon="file-text"
            emptyText="No log entries found"
          />
        </TabsContent>
        <TabsContent value="errors">
          <DataTable
            columns={logsColumns}
            data={errorLogs}
            searchPlaceholder="Search error logs..."
            emptyIcon="check"
            emptyText="No error logs recorded"
          />
        </TabsContent>
        <TabsContent value="api">
          <DataTable
            columns={logsColumns}
            data={[]}
            searchPlaceholder="Search API logs..."
            emptyIcon="file-text"
            emptyText="Access logs will appear here"
          />
        </TabsContent>
        <TabsContent value="auth">
          <DataTable
            columns={logsColumns}
            data={[]}
            searchPlaceholder="Search auth logs..."
            emptyIcon="file-text"
            emptyText="Auth logs will appear here"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
