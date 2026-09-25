"use client";

import { ROLES } from "@/lib/constants/const";
import { StaffUserManager } from "@/components/admin/staff-user-manager";
import { getColumns } from "./columns";

export default function TutorsPage() {
  return (
    <StaffUserManager
      role={ROLES.TUTOR}
      title="Tutors"
      subtitle="Manage tutor profiles and their performance"
      createButtonLabel="Create Tutor"
      getColumns={getColumns}
    />
  );
}
