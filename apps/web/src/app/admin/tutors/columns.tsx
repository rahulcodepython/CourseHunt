"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { AdminProfileItem, UserListResponse } from "@/schema/users.types";
import { Icon } from "@/components/icon";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { RolesCell } from "@/components/roles-cell";
import { StatusBadge } from "@/components/status-badge";
import { bannedStatusMap } from "@/lib/user-status";
import UserCell from "@/components/user-cell";

// /tutors sources rows from useUsersQuery (UserListResponse), not the
// profiles endpoint — total_students/rating_avg aren't actually present on
// that response today, but the columns below already tolerate their absence
// (fallback dashes), so this widened type just adds what those columns need
// without touching that pre-existing display gap.
type TutorRow = UserListResponse & Partial<Pick<AdminProfileItem, "total_students" | "rating_avg">>;

const columnHelper = createColumnHelper<TutorRow>();

export const getColumns = (
  onManage: (tutor: TutorRow) => void,
  onBanToggle: (tutor: TutorRow) => void,
  onChangePassword: (tutor: TutorRow) => void,
  {
    canBan,
    canChangePassword,
    currentUserId,
  }: { canBan: boolean; canChangePassword: boolean; currentUserId?: string },
) => [
  columnHelper.accessor("name", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Tutor" />,
    cell: ({ row }) => <UserCell name={row.original.name} />,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
  columnHelper.accessor("roles", {
    header: "Roles",
    cell: ({ getValue, row }) => (
      <RolesCell
        roles={getValue()}
        fallbackRole={row.original.role ?? "tutor"}
        variantFor={(name) => (name === "tutor" ? "default" : "secondary")}
      />
    ),
  }),
  columnHelper.accessor("total_students", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Students" />,
    cell: ({ getValue }) => (
      <span className="tabular-nums">{(getValue() ?? 0).toLocaleString()}</span>
    ),
  }),
  columnHelper.accessor("rating_avg", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Rating" />,
    cell: ({ getValue }) => {
      const rating = getValue();
      return (
        <div className="flex items-center gap-1">
          <Icon name="star" className="size-4 fill-yellow-500 text-yellow-500" />
          <span className="font-medium tabular-nums">{rating ? rating.toFixed(1) : "—"}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("banned", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Status" />,
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() ? "banned" : "active"} map={bannedStatusMap} />
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const tutor = row.original;
      return (
        <RowActions>
          <RowActionButton icon="users" label="Manage Roles" onClick={() => onManage(tutor)} />
          {canChangePassword && (
            <RowActionButton
              icon="lock"
              label="Change Password"
              onClick={() => onChangePassword(tutor)}
            />
          )}
          {canBan && tutor.id !== currentUserId && (
            <RowActionButton
              icon="ban"
              label={tutor.banned ? "Unban Tutor" : "Ban Tutor"}
              onClick={() => onBanToggle(tutor)}
              destructive={!tutor.banned}
            />
          )}
        </RowActions>
      );
    },
  }),
];
