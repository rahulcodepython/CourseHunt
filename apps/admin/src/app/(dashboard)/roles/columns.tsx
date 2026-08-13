"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Role } from "@/schema/roles.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Role>();

export const getColumns = (
  expandedRoleId: string | null,
  onToggleExpand: (roleId: string) => void,
  onDelete: (role: Role) => void,
) => [
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Role</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
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
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const role = row.original;
      const expanded = expandedRoleId === role.id;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className={cn("size-8", expanded && "border-primary text-primary")}
            onClick={() => onToggleExpand(role.id)}
            aria-label="Manage permissions"
          >
            <Icon name="shield" className="size-4" />
          </Button>
          {!role.is_system && (
            <Button
              variant="outline"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(role)}
              aria-label="Delete role"
            >
              <Icon name="trash" className="size-4" />
            </Button>
          )}
        </div>
      );
    },
  }),
];
