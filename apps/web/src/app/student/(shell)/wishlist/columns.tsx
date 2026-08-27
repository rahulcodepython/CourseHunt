"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { WishlistItem } from "@/schema/wishlist.types";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<WishlistItem>();

export const getColumns = (onRemove: (item: WishlistItem) => void): ColumnDef<WishlistItem, any>[] => [
    columnHelper.accessor((row) => row.course.title, {
        id: "course",
        header: "Course",
        cell: ({ row }) => {
            const course = row.original.course;
            return (
                <div className="flex items-center gap-3">
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        {course.thumbnail ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={course.thumbnail} alt={course.title} className="size-full object-cover" />
                        ) : (
                            <Icon name="book" className="size-5 opacity-40" />
                        )}
                    </div>
                    {course.slug ? (
                        <Link href={`/courses/${course.slug}`} className="max-w-70 truncate font-medium hover:text-primary">
                            {course.title}
                        </Link>
                    ) : (
                        <p className="max-w-70 truncate font-medium">{course.title}</p>
                    )}
                </div>
            );
        },
    }),
    columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const item = row.original;
            return (
                <div className="flex justify-end gap-2">
                    {item.course.slug && (
                        <Button variant="outline" size="icon" className="size-8" asChild aria-label="View Course">
                            <Link href={`/courses/${item.course.slug}`}>
                                <Icon name="external-link" className="size-4" />
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" size="icon" className="size-8" onClick={() => onRemove(item)} aria-label="Remove from wishlist">
                        <Icon name="x" className="size-4" />
                    </Button>
                </div>
            );
        },
    }),
];
