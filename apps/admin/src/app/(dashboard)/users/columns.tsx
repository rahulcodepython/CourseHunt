"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { UserListResponse } from "@/schema/users.types";
import { formatDate } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<UserListResponse>();

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  tutor: "secondary",
  student: "outline",
};

export const columns = [
  columnHelper.accessor("name", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>User</span>
          <Icon name="arrow-up-down" className="ml-2 size-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      const initials = (user.name || "U")
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
    header: "Role",
    cell: ({ getValue }) => {
      const roles = getValue();
      return (
        <div className="flex flex-wrap gap-1">
          {roles?.length ? (
            roles.map((r) => (
              <Badge
                key={r.id}
                variant={roleBadgeVariant[r.name] ?? "outline"}
                className="capitalize"
              >
                {r.name}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">student</Badge>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("banned", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Status</span>
          <Icon name="arrow-up-down" className="ml-2 size-3.5" />
        </Button>
      );
    },
    cell: ({ getValue }) => {
      const banned = getValue();
      return banned ? (
        <Badge variant="destructive">Banned</Badge>
      ) : (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
        >
          Active
        </Badge>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Joined</span>
          <Icon name="arrow-up-down" className="ml-2 size-3.5" />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDate(getValue() || "")}</span>
    ),
  }),
];
