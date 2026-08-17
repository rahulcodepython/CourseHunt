"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { UpdateFeedItem } from "@/schema/updates.types";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

const columnHelper = createColumnHelper<UpdateFeedItem>();

export const columns: ColumnDef<UpdateFeedItem, any>[] = [
  columnHelper.accessor((row) => row.course?.title || "Platform-wide", {
    id: "course",
    header: "Course",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("message", {
    header: "Message",
    cell: ({ getValue }) => <p className="line-clamp-2 max-w-md text-muted-foreground">{getValue()}</p>,
  }),
  columnHelper.accessor("created_at", {
    header: "Date",
    cell: ({ getValue }) => <span className="text-muted-foreground">{formatDateTime(getValue())}</span>,
  }),
  columnHelper.accessor("is_unseen", {
    header: "",
    cell: ({ getValue }) => (getValue() ? <Badge variant="default">New</Badge> : null),
  }),
];
