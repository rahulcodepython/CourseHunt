"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { UserListResponse } from "@/schema/users.types";
import { formatDate } from "@/lib/format";
import { bannedStatusMap } from "@/lib/user-status";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { RolesCell } from "@/components/roles-cell";
import { StatusBadge } from "@/components/status-badge";
import UserCell from "@/components/user-cell";

const columnHelper = createColumnHelper<UserListResponse>();

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  tutor: "secondary",
  student: "outline",
};

export const getColumns = (
  onBanToggle: (user: UserListResponse) => void,
  { canBan, currentUserId }: { canBan: boolean; currentUserId?: string },
) => [
  columnHelper.accessor("name", {
    header: ({ column }) => <SortableColumnHeader column={column} label="User" />,
    cell: ({ row }) => <UserCell name={row.original.name} image={row.original.image} />,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("roles", {
    header: "Role",
    cell: ({ getValue, row }) => (
      <RolesCell
        roles={getValue()}
        fallbackRole={row.original.role}
        variantFor={(name) => roleBadgeVariant[name] ?? "outline"}
        emptyLabel="user"
      />
    ),
  }),
  columnHelper.accessor("banned", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Status" />,
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() ? "banned" : "active"} map={bannedStatusMap} />
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Joined" />,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDate(getValue() || "")}</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <RowActions>
          <RowActionButton icon="book" label="View Courses" href={`/admin/users/${user.id}/courses`} />
          {canBan && user.id !== currentUserId && (
            <RowActionButton
              icon="ban"
              label={user.banned ? "Unban User" : "Ban User"}
              onClick={() => onBanToggle(user)}
              destructive={!user.banned}
            />
          )}
        </RowActions>
      );
    },
  }),
];
