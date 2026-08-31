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

export const getColumns = (
  onManage: (user: UserListResponse) => void,
  onBanToggle: (user: UserListResponse) => void,
  onChangePassword: (user: UserListResponse) => void,
  {
    canBan,
    canChangePassword,
    currentUserId,
  }: { canBan: boolean; canChangePassword: boolean; currentUserId?: string },
) => [
  columnHelper.accessor("name", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Name" />,
    cell: ({ row }) => <UserCell name={row.original.name} image={row.original.image} />,
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
        fallbackRole={row.original.role ?? "admin"}
        variantFor={(name) => (name === "admin" ? "default" : "secondary")}
      />
    ),
  }),
  columnHelper.accessor("banned", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Status" />,
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() ? "banned" : "active"} map={bannedStatusMap} />
    ),
  }),
  columnHelper.accessor("created_at", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Joined" />,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDate(getValue() || "")}</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const admin = row.original;
      return (
        <RowActions>
          <RowActionButton icon="users" label="Manage Roles" onClick={() => onManage(admin)} />
          {canChangePassword && (
            <RowActionButton
              icon="lock"
              label="Change Password"
              onClick={() => onChangePassword(admin)}
            />
          )}
          {canBan && admin.id !== currentUserId && (
            <RowActionButton
              icon="ban"
              label={admin.banned ? "Unban Admin" : "Ban Admin"}
              onClick={() => onBanToggle(admin)}
              destructive={!admin.banned}
            />
          )}
        </RowActions>
      );
    },
  }),
];
