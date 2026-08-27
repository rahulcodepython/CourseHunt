"use client";

import * as React from "react";

import { useWishlistQuery, useRemoveCourseFromWishlistMutation, useClearWishlistMutation } from "@/query-hooks/wishlist.api";
import type { WishlistItem } from "@/schema/wishlist.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { getColumns } from "./columns";

export default function StudentWishlistPage() {
    const { data: raw, isLoading } = useWishlistQuery();
    const removeMutation = useRemoveCourseFromWishlistMutation();
    const clearMutation = useClearWishlistMutation();

    const items: WishlistItem[] = raw?.data?.data ?? [];
    const [removing, setRemoving] = React.useState<WishlistItem | null>(null);
    const [clearing, setClearing] = React.useState(false);

    const columns = React.useMemo(() => getColumns(setRemoving), []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Wishlist"
                subtitle="Courses you've saved for later"
                actions={
                    items.length > 0 ? (
                        <Button variant="outline" size="icon" onClick={() => setClearing(true)} aria-label="Clear All">
                            <Icon name="trash" className="size-4" />
                        </Button>
                    ) : undefined
                }
            />

            <DataTable
                columns={columns}
                data={items}
                showColumnToggle={false}
                emptyIcon="heart"
                emptyText="Your wishlist is empty."
                isLoading={isLoading}
                loadingText="Loading your wishlist..."
            />

            <ConfirmDeleteDialog
                open={!!removing}
                onOpenChange={(open) => !open && setRemoving(null)}
                onConfirm={async () => {
                    if (!removing) return;
                    const res = await removeMutation.execute(removing.id);
                    if (res?.success) setRemoving(null);
                }}
                loading={removeMutation.isPending}
                title="Remove from Wishlist"
                description={`Remove "${removing?.course.title}" from your wishlist?`}
                confirmText="Remove"
            />

            <ConfirmDeleteDialog
                open={clearing}
                onOpenChange={setClearing}
                onConfirm={async () => {
                    const res = await clearMutation.execute();
                    if (res?.success) setClearing(false);
                }}
                loading={clearMutation.isPending}
                title="Clear Wishlist"
                description="Remove every course from your wishlist? This action cannot be undone."
                confirmText="Clear All"
            />
        </div>
    );
}
