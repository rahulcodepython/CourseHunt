"use client";
import * as React from "react";

import {
  useInfiniteCouponsQuery,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from "@/query-hooks/coupons.api";
import type { Coupon } from "@/schema/coupons.types";
import { Loading } from "@/components/common/loading";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";
import { DataTable } from "@/components/table/data-table";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/dialogs/form-dialog";
import { CouponForm } from "./coupon-form";
import { getColumns } from "./coupon-columns";

import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";

const COPY = {
  admin: { title: "Coupons", subtitle: "Create and manage discount coupons for any course" },
  tutor: {
    title: "My Coupons",
    subtitle: "Create and manage discount coupons for your courses",
  },
} as const;

export function CouponsManager({
  scope,
  fixedCourseId,
  fixedCourseTitle,
}: {
  scope: "admin" | "tutor";
  fixedCourseId?: string;
  fixedCourseTitle?: string;
}) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCouponsQuery(scope, { limit: 12, course_id: fixedCourseId });
  const updateMutation = useUpdateCouponMutation(scope);
  const deleteMutation = useDeleteCouponMutation(scope);

  const rawCoupons: Coupon[] = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const coupons = React.useMemo(
    () => (fixedCourseId ? rawCoupons.filter((c) => c.course?.id === fixedCourseId) : rawCoupons),
    [rawCoupons, fixedCourseId],
  );
  const totalCount = fixedCourseId ? coupons.length : (data?.pages[0]?.total ?? 0);

  const {
    dialogOpen: isModalOpen,
    setDialogOpen: setIsModalOpen,
    editing: editingCoupon,
    openCreate,
    openEdit,
    deleting: deleteId,
    setDeleting: setDeleteId,
    requestDelete,
    confirmDelete,
  } = useCrudDialogState<Coupon>();

  const handleToggleActive = (coupon: Coupon) => {
    updateMutation.execute({ id: coupon.id, data: { is_active: !coupon.is_active } });
  };

  if (isLoading || (!data && !coupons.length)) {
    return <Loading />;
  }

  const columns = getColumns(openEdit, handleToggleActive, requestDelete, scope);
  const copy = COPY[scope];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            {fixedCourseId ? "Course Coupons" : copy.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {fixedCourseId ? "Discount coupons specific to this course" : copy.subtitle}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icon name="plus" className="size-4" />
          Create Coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        searchPlaceholder="Search coupons..."
        emptyIcon="ticket"
        emptyText="No coupons found"
        isLoading={isLoading}
        loadingText="Loading coupons..."
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
      />

      <FormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingCoupon ? "Edit Coupon" : "Create Coupon"}
        description={
          editingCoupon
            ? "Update the coupon details"
            : fixedCourseId
              ? "Create a discount coupon specific to this course"
              : scope === "tutor"
                ? "Create a discount coupon for one of your courses"
                : "Create a new discount coupon"
        }
      >
        {isModalOpen && (
          <CouponForm
            editingCoupon={editingCoupon}
            onSuccess={() => setIsModalOpen(false)}
            scope={scope}
            fixedCourseId={fixedCourseId}
            fixedCourseTitle={fixedCourseTitle}
          />
        )}
      </FormDialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => confirmDelete(deleteMutation.execute)}
        title="Delete Coupon"
        description={`Are you sure you want to delete coupon "${deleteId?.code}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
        confirmText="Delete Coupon"
      />
    </div>
  );
}
