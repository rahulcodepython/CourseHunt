"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { LessonResource } from "@/schema/lessons.types";
import { Badge } from "@/components/ui/badge";
import { RowActions, RowActionButton } from "@/components/row-actions";

const columnHelper = createColumnHelper<LessonResource>();

export const getColumns = (onDelete: (resource: LessonResource) => void) => [
  columnHelper.accessor("title", {
    header: "Title",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("file_type", {
    header: "File Type",
    cell: ({ getValue }) => {
      const type = getValue();
      return type ? (
        <Badge variant="outline" className="uppercase">
          {type}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const resource = row.original;
      return (
        <RowActions>
          <RowActionButton icon="external-link" label="Open File" href={resource.file_url} />
          <RowActionButton
            icon="trash"
            label="Delete Resource"
            onClick={() => onDelete(resource)}
            destructive
          />
        </RowActions>
      );
    },
  }),
];
