"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Feedback } from "@/schema/feedbacks.types";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/icon";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { StatusBadge, type StatusBadgeEntry } from "@/components/status-badge";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Feedback>();

const pinStatusMap: Record<string, StatusBadgeEntry> = {
  pinned: { label: "Pinned", variant: "secondary", className: "bg-blue-500/10 text-blue-500" },
  normal: { label: "Normal", variant: "outline" },
};

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
    header: ({ column }) => <SortableColumnHeader column={column} label="User" />,
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor((row) => row.course?.title ?? "Unknown", {
    id: "course",
    header: ({ column }) => <SortableColumnHeader column={column} label="Course" />,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("rating", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Rating" />,
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
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() ? "pinned" : "normal"} map={pinStatusMap} />
    ),
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true;
      if (value === "pinned") return row.getValue(id) === true;
      if (value === "normal") return row.getValue(id) === false;
      return true;
    },
  }),
  columnHelper.accessor("created_at", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Date" />,
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
        <RowActions>
          <RowActionButton
            icon="pin"
            label={fb.is_pinned ? "Unpin Feedback" : "Pin Feedback"}
            onClick={() => onPinToggle(fb)}
            className={cn(fb.is_pinned && "text-primary")}
            iconClassName={cn(fb.is_pinned && "rotate-45")}
          />
          <RowActionButton icon="trash" label="Delete Feedback" onClick={() => onDelete(fb)} destructive />
        </RowActions>
      );
    },
  }),
];
