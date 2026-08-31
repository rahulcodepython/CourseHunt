"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { ListEnrollmentResponse } from "@/schema/enrollments.types";
import {
  useEnrollmentsQuery,
  useRevokeEnrollmentMutation,
  useRegainEnrollmentMutation,
} from "@/query-hooks/enrollments.api";
import { formatDate } from "@/lib/format";
import { DataTable } from "@/components/data-table";
import UserCell from "@/components/user-cell";
import { Icon } from "@/components/icon";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";
import { ENROLLMENT_STATUS } from "@/lib/const";

const columnHelper = createColumnHelper<ListEnrollmentResponse>();

const progressStatusMap: Record<string, StatusBadgeEntry> = {
  completed: {
    label: "Completed",
    variant: "secondary",
    className: "bg-emerald-500/10 text-emerald-500",
  },
  in_progress: { label: "In Progress", variant: "outline" },
};

const accessStatusMap: Record<string, StatusBadgeEntry> = {
  [ENROLLMENT_STATUS.ACTIVE]: {
    label: "Active",
    variant: "secondary",
    className: "bg-emerald-500/10 text-emerald-500",
  },
  [ENROLLMENT_STATUS.REVOKED]: { label: "Revoked", variant: "destructive" },
};

/**
 * Shared enrollment list + optional revoke/regain-access toggle, reused by:
 *  - /users/[userId]/courses  (courses a specific user purchased)
 *  - /courses/[courseId]/enrollments  (users enrolled in a specific course)
 *  - /tutor/courses/[courseId]/enrollments  (read-only: tutors see enrolled
 *    students but revoke/regain is admin-only)
 */
export function EnrollmentAccessTable({
  courseId,
  userId,
  emptyText,
  showAccessActions = true,
}: {
  courseId?: string;
  userId?: string;
  emptyText: string;
  showAccessActions?: boolean;
}) {
  const params = { courseId, userId };
  const scope = showAccessActions ? "admin" : "tutor";
  const { data: raw, isLoading } = useEnrollmentsQuery(params, scope);
  const revokeMutation = useRevokeEnrollmentMutation(params);
  const regainMutation = useRegainEnrollmentMutation(params);

  const enrollments = raw?.data?.data ?? [];

  const columns: ColumnDef<ListEnrollmentResponse, any>[] = [
    columnHelper.accessor((row) => row.course.title, {
      id: "course",
      header: "Course",
      cell: ({ row }) => {
        const course = row.original.course;
        return (
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              {course.thumbnail ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={course.thumbnail} alt={course.title} className="size-full object-cover" />
              ) : (
                <Icon name="book" className="size-4 opacity-40" />
              )}
            </div>
            <span className="max-w-52 truncate font-medium">{course.title}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor((row) => row.user.name, {
      id: "user",
      header: "User",
      cell: ({ row }) => <UserCell name={row.original.user.name} image={row.original.user.image} />,
    }),
    columnHelper.accessor("completion_percent", {
      header: "Progress",
      cell: ({ getValue }) => <span className="tabular-nums">{Math.round(getValue())}%</span>,
    }),
    columnHelper.accessor("completed", {
      header: "Status",
      cell: ({ getValue }) => (
        <StatusBadge status={getValue() ? "completed" : "in_progress"} map={progressStatusMap} />
      ),
    }),
    columnHelper.accessor("revoked", {
      header: "Access",
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue() ? ENROLLMENT_STATUS.REVOKED : ENROLLMENT_STATUS.ACTIVE}
          map={accessStatusMap}
        />
      ),
    }),
    columnHelper.accessor("enrolled_at", {
      header: "Enrolled",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue())}</span>
      ),
    }),
  ];

  if (showAccessActions) {
    columns.push(
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const enrollment = row.original;
          const isRevoked = enrollment.revoked;
          const toggle = () => {
            const vars = { userId: enrollment.user.id, courseId: enrollment.course.id };
            if (isRevoked) {
              regainMutation.execute(vars);
            } else {
              revokeMutation.execute(vars);
            }
          };
          return (
            <RowActions>
              <RowActionButton
                icon={isRevoked ? "refresh" : "ban"}
                label={isRevoked ? "Regain Access" : "Revoke Access"}
                onClick={toggle}
                destructive={!isRevoked}
              />
            </RowActions>
          );
        },
      }),
    );
  }

  return (
    <DataTable
      columns={columns}
      data={enrollments}
      searchPlaceholder="Search..."
      searchColumnKey={userId ? "course" : "user"}
      emptyIcon="users"
      emptyText={emptyText}
      isLoading={isLoading}
      loadingText="Loading..."
    />
  );
}
