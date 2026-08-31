"use client";
import * as React from "react";

import {
  useCouponsQuery,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from "@/query-hooks/coupons.api";
import type { Coupon } from "@/schema/coupons.types";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { CouponModal } from "./coupon-modal";
import { getColumns } from "./coupon-columns";

import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";

const COPY = {
  admin: { title: "Coupons", subtitle: "Create and manage discount coupons for any course" },
  tutor: {
    title: "My Coupons",
    subtitle: "Create and manage discount coupons for your courses",
  },
} as const;

/**
 * Shared admin/tutor coupons list — the backend already scopes which
 * coupons `useCouponsQuery()` returns per the caller's role, so this
 * component only needs to vary copy, the course-selector requirement, and
 * one table column by scope (see coupon-form.tsx / coupon-columns.tsx).
 */
export function CouponsManager({ scope }: { scope: "admin" | "tutor" }) {
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

  const columns = getColumns(openEdit, handleToggleActive, requestDelete, scope);
  const copy = COPY[scope];

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
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
        scope={scope}
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
