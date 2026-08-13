"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { AdminProfileItem } from "@/schema/users.types";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { toast } from "sonner";

const columnHelper = createColumnHelper<AdminProfileItem>();

export const columns = [
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Tutor</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("headline", {
    header: "Headline",
    cell: ({ getValue }) => (
      <span className="block max-w-48 truncate text-muted-foreground">
        {getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("total_students", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Students</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">
        {(getValue() ?? 0).toLocaleString()}
      </span>
    ),
  }),
  columnHelper.accessor("rating_avg", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Rating</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => {
      const rating = getValue();
      return (
        <div className="flex items-center gap-1">
          <Icon
            name="star"
            className="size-4 fill-yellow-500 text-yellow-500"
          />
          <span className="font-medium tabular-nums">
            {rating ? rating.toFixed(1) : "—"}
          </span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const tutor = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => toast.info(`Viewing ${tutor.name}'s profile`)}
            aria-label="View tutor"
          >
            <Icon name="eye" className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => toast.error(`${tutor.name} has been banned`)}
            aria-label="Ban tutor"
          >
            <Icon name="ban" className="size-4" />
          </Button>
        </div>
      );
    },
  }),
];
