"use client";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationsFeedTable } from "@/components/table/notifications-table";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Platform activity: logins, purchases, discussions, feedback, and system errors"
      />
      <NotificationsFeedTable />
    </div>
  );
}
