"use client";

import * as React from "react";

import {
  useInfiniteWishlistQuery,
  useRemoveCourseFromWishlistMutation,
  useClearWishlistMutation,
} from "@/query-hooks/wishlist.api";
import type { WishlistItem } from "@/schema/wishlist.types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/common/icon";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";
import { getColumns } from "./columns";

export default function StudentWishlistPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteWishlistQuery({ limit: 12 });
  const removeMutation = useRemoveCourseFromWishlistMutation();
  const clearMutation = useClearWishlistMutation();

  const items: WishlistItem[] = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.total ?? 0;

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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setClearing(true)}
              aria-label="Clear All"
            >
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
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
      />

      <ConfirmDeleteDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            await removeMutation.execute(removing.course.id);
            setRemoving(null);
          }
        }}
        title="Remove from Wishlist"
        description={`Remove "${removing?.course.title}" from your wishlist?`}
        confirmText="Remove"
        loading={removeMutation.isPending}
      />

      <ConfirmDeleteDialog
        open={clearing}
        onOpenChange={setClearing}
        onConfirm={async () => {
          await clearMutation.execute(undefined);
          setClearing(false);
        }}
        title="Clear Wishlist"
        description="Are you sure you want to remove all courses from your wishlist?"
        confirmText="Clear All"
        loading={clearMutation.isPending}
      />
    </div>
  );
}
