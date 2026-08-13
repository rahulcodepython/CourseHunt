"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Feedback } from "@/schema/feedbacks.types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Feedback>();

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          className={cn(
            "size-3.5",
            i < rating
              ? "fill-yellow-500 text-yellow-500"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export const getColumns = (
  onPinToggle: (feedback: Feedback) => void,
  onDelete: (feedback: Feedback) => void,
): ColumnDef<Feedback, any>[] => [
  columnHelper.accessor((row) => row.user?.name || "Anonymous", {
    id: "user",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>User</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor((row) => row.course?.title ?? "Unknown", {
    id: "course",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Course</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("rating", {
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
    cell: ({ getValue }) => <StarRating rating={getValue() || 0} />,
  }),
  columnHelper.accessor("content", {
    header: "Comment",
    cell: ({ getValue }) => (
      <span className="line-clamp-2 max-w-xs text-muted-foreground">
        {getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("is_pinned", {
    header: "Status",
    cell: ({ getValue }) => {
      const isPinned = getValue();
      return isPinned ? (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
          Pinned
        </Badge>
      ) : (
        <Badge variant="outline">Normal</Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true;
      if (value === "pinned") return row.getValue(id) === true;
      if (value === "normal") return row.getValue(id) === false;
      return true;
    },
  }),
  columnHelper.accessor("created_at", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Date</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDate(getValue())}</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const fb = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className={cn("size-8", fb.is_pinned && "text-primary")}
            onClick={() => onPinToggle(fb)}
            aria-label={fb.is_pinned ? "Unpin" : "Pin"}
          >
            <Icon
              name="pin"
              className={cn("size-4", fb.is_pinned && "rotate-45")}
            />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(fb)}
            aria-label="Delete feedback"
          >
            <Icon name="trash" className="size-4" />
          </Button>
        </div>
      );
    },
  }),
];
