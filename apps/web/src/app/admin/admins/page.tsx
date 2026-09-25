"use client";

import { ROLES } from "@/lib/constants/const";
import { StaffUserManager } from "@/components/admin/staff-user-manager";
import { getColumns } from "./columns";

export default function AdminsPage() {
  return (
    <StaffUserManager
      role={ROLES.ADMIN}
      title="Admin Users"
      subtitle="View platform administrators and manage role assignments"
      createButtonLabel="Create Admin"
      getColumns={getColumns}
    />
  );
}
