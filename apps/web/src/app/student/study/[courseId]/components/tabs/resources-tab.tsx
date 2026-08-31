"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { useStudyLessonResourcesQuery } from "@/query-hooks/lessons.api";
import type { LessonResource } from "@/schema/lessons.types";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<LessonResource>();

const columns: ColumnDef<LessonResource, any>[] = [
  columnHelper.accessor("title", {
    header: "Title",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("file_type", {
    header: "Type",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs uppercase text-muted-foreground">
        {getValue() ?? "file"}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Download</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href={row.original.file_url} download target="_blank" rel="noopener noreferrer">
            <Icon name="download" className="size-3.5" />
            Download
          </a>
        </Button>
      </div>
    ),
  }),
];

export function ResourcesTab({ lessonId }: { lessonId: string }) {
  const { data: raw, isLoading } = useStudyLessonResourcesQuery(lessonId);
  const resources = raw?.data ?? [];

  return (
    <DataTable
      columns={columns}
      data={resources}
      showColumnToggle={false}
      emptyIcon="folder"
      emptyText="No resources for this lesson."
      isLoading={isLoading}
      loadingText="Loading resources..."
    />
  );
}
