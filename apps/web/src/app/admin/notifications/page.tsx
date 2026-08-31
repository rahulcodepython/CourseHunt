"use client";

import { PageHeader } from "@/components/page-header";
import { NotificationsFeedTable } from "@/components/notifications-table";

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
