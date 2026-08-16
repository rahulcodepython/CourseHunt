"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Role } from "@/schema/roles.types";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Role>();

export const getColumns = (
  expandedRoleId: string | null,
  onToggleExpand: (roleId: string) => void,
  onDelete: (role: Role) => void,
) => [
  columnHelper.accessor("name", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Role" />,
    cell: ({ getValue }) => (
      <Badge variant="secondary" className="font-mono">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue() ?? "—"}</span>
    ),
  }),
  columnHelper.accessor("is_system", {
    header: "System",
    cell: ({ getValue }) => {
      const isSystem = getValue();
      return isSystem ? (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <Icon name="lock" className="size-3" />
          System
        </Badge>
      ) : (
        <Badge variant="secondary">Custom</Badge>
      );
    },
  }),
  columnHelper.accessor("permissions_count", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Permissions" />,
    cell: ({ getValue }) => {
      const count = getValue() ?? 0;
      return (
        <Badge variant="outline" className="font-mono text-xs text-zinc-300">
          {count} {count === 1 ? "permission" : "permissions"}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const role = row.original;
      const expanded = expandedRoleId === role.id;
      return (
        <RowActions>
          {!role.is_system && (
            <RowActionButton
              icon="shield"
              label="Manage Permissions"
              onClick={() => onToggleExpand(role.id)}
              className={cn(expanded && "border-primary text-primary")}
            />
          )}
          {!role.is_system && (
            <RowActionButton icon="trash" label="Delete Role" onClick={() => onDelete(role)} destructive />
          )}
        </RowActions>
      );
    },
  }),
];
