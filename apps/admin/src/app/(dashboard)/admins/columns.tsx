"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { UserListResponse } from "@/schema/users.types";
import { formatDate } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<UserListResponse>();

export const getColumns = (onManage: (user: UserListResponse) => void) => [
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Name</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original;
      const initials = (user.name || "A")
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            {user.image ? <AvatarImage src={user.image} /> : null}
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("roles", {
    header: "Roles",
    cell: ({ getValue }) => (
      <div className="flex flex-wrap gap-1">
        {getValue().map((r) => (
          <Badge
            key={r.id}
            variant={r.name === "admin" ? "default" : "secondary"}
            className="capitalize"
          >
            {r.name}
          </Badge>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Joined</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDate(getValue() || "")}</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onManage(row.original)}
        >
          <Icon name="users" className="size-4" />
          Manage
        </Button>
      </div>
    ),
  }),
];
