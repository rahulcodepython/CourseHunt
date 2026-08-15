"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Course } from "@/schema/courses.types";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";

const columnHelper = createColumnHelper<Course>();

export const columns = [
    columnHelper.accessor("title", {
        header: ({ column }) => <SortableColumnHeader column={column} label="Course" />,
        cell: ({ row }) => {
            const course = row.original;
            return (
                <div className="flex items-center gap-3">
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        {course.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={course.image_url}
                                alt={course.title}
                                className="size-full object-cover"
                            />
                        ) : (
                            <Icon name="book" className="size-5 opacity-40" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="max-w-70 truncate font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                            {course.total_lectures} lectures
                        </p>
                    </div>
                </div>
            );
        },
    }),
    columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
            const status = getValue();
            return (
                <Badge
                    variant={status === "published" ? "default" : "secondary"}
                    className="capitalize"
                >
                    {status}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            return value === "all" ? true : row.getValue(id) === value;
        },
    }),
    columnHelper.accessor("final_price", {
        header: ({ column }) => <SortableColumnHeader column={column} label="Price" />,
        cell: ({ getValue }) => (
            <span className="font-medium tabular-nums">{formatINR(getValue())}</span>
        ),
    }),
    columnHelper.accessor("rating_avg", {
        header: ({ column }) => <SortableColumnHeader column={column} label="Rating" />,
        cell: ({ getValue }) => {
            const rating = getValue();
            return (
                <div className="flex items-center gap-1">
                    <Icon
                        name="star"
                        className="size-4 fill-yellow-500 text-yellow-500"
                    />
                    <span className="tabular-nums">
                        {rating ? rating.toFixed(1) : "—"}
                    </span>
                </div>
            );
        },
    }),
    columnHelper.accessor("student_count", {
        header: ({ column }) => <SortableColumnHeader column={column} label="Students" />,
        cell: ({ getValue }) => (
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon name="users" className="size-4" />
                <span className="tabular-nums">
                    {(getValue() ?? 0).toLocaleString()}
                </span>
            </div>
        ),
    }),
    columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const course = row.original;
            return (
                <RowActions>
                    <RowActionButton icon="hierarchy" label="View Chapters" href={`/courses/${course.id}/chapters`} />
                    <RowActionButton icon="users" label="View Enrolled Users" href={`/courses/${course.id}/enrollments`} />
                    <RowActionButton icon="chart-bar" label="View Analytics" href={`/courses/overview/${course.id}`} />
                </RowActions>
            );
        },
    }),
];
