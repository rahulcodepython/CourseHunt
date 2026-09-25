"use client";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationsFeedTable } from "@/components/table/notifications-table";

export default function TutorNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="New discussions and feedback across your courses"
      />
      <NotificationsFeedTable />
    </div>
  );
}
