"use client";
import * as React from "react";


import { useCouponsQuery, useUpdateCouponMutation, useDeleteCouponMutation } from "@/query-hooks/coupons.api";
import type { Coupon } from "@/schema/coupons.types";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { CouponModal } from "./coupon-modal";
import { getColumns } from "./columns";

import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";

export default function TutorCouponsPage() {
  const { data: raw, isLoading } = useCouponsQuery();
  const updateMutation = useUpdateCouponMutation();
  const deleteMutation = useDeleteCouponMutation();
  const coupons: Coupon[] = raw?.data?.data ?? [];

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

  if (isLoading || (!raw?.data && !coupons.length)) {
    return <Loading />;
  }

  const columns = getColumns(openEdit, handleToggleActive, requestDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Coupons"
        subtitle="Create and manage discount coupons for your courses"
        actions={
          <Button onClick={openCreate}>
            <Icon name="plus" className="size-4" />
            Create Coupon
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={coupons}
        searchPlaceholder="Search coupons..."
        emptyIcon="ticket"
        emptyText="No coupons found"
      />

      <CouponModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingCoupon={editingCoupon}
      />

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