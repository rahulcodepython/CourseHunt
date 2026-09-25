"use client";
import * as React from "react";

import {
  useCouponsQuery,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from "@/query-hooks/coupons.api";
import type { Coupon } from "@/schema/coupons.types";
import { PageHeader } from "@/components/layout/page-header";
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

export function CouponsManager({ scope }: { scope: "admin" | "tutor" }) {
  const { data: raw, isLoading } = useCouponsQuery(scope);
  const updateMutation = useUpdateCouponMutation(scope);
  const deleteMutation = useDeleteCouponMutation(scope);
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

      <FormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingCoupon ? "Edit Coupon" : "Create Coupon"}
        description={
          editingCoupon
            ? "Update the coupon details"
            : scope === "tutor"
              ? "Create a discount coupon for one of your courses"
              : "Create a new discount coupon"
        }
      >
        <CouponForm
          editingCoupon={editingCoupon}
          onSuccess={() => setIsModalOpen(false)}
          scope={scope}
        />
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
