"use client";

import * as React from "react";
import { useUsersQuery } from "@/query-hooks/users.api";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";

export default function TutorsPage() {
  const { data: rawTutors, isLoading } = useUsersQuery({ role: "tutor" });
  const tutors = (rawTutors?.data?.data as any) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutors"
        subtitle="Manage tutor profiles and their performance"
      />

      <DataTable
        columns={columns}
        data={tutors}
        emptyIcon="book"
        emptyText={isLoading ? "Loading tutors..." : "No tutors found"}
      />
    </div>
  );
}
