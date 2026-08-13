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

export default function CouponsPage() {
  const { data: raw, isLoading } = useCouponsQuery();
  const updateMutation = useUpdateCouponMutation();
  const deleteMutation = useDeleteCouponMutation();
  const coupons: Coupon[] = (raw?.data?.data as any)?.data ?? (Array.isArray(raw?.data?.data) ? raw.data.data : []);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = React.useState<Coupon | null>(null);

  const openCreate = () => {
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleToggleActive = (coupon: Coupon) => {
    updateMutation.execute({ id: coupon.id, data: { is_active: !coupon.is_active } });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.execute(deleteId.id);
      setDeleteId(null);
    }
  };

  if (isLoading || (!raw?.data && !coupons.length)) {
    return <Loading />;
  }

  const columns = getColumns(openEdit, handleToggleActive, setDeleteId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        subtitle="Create and manage discount coupons"
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
        onConfirm={handleDelete}
        title="Delete Coupon"
        description={`Are you sure you want to delete coupon "${deleteId?.code}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
        confirmText="Delete Coupon"
      />
    </div>
  );
}
