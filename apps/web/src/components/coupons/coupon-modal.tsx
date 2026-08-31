"use client";

import { FormDialog } from "@/components/form-dialog";
import type { Coupon } from "@/schema/coupons.types";
import { CouponForm } from "./coupon-form";

export function CouponModal({
  open,
  onOpenChange,
  editingCoupon,
  scope,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCoupon: Coupon | null;
  scope: "admin" | "tutor";
}) {
  const createDescription =
    scope === "tutor"
      ? "Create a discount coupon for one of your courses"
      : "Create a new discount coupon";

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingCoupon ? "Edit Coupon" : "Create Coupon"}
      description={editingCoupon ? "Update the coupon details" : createDescription}
    >
      <CouponForm
        editingCoupon={editingCoupon}
        onSuccess={() => onOpenChange(false)}
        scope={scope}
      />
    </FormDialog>
  );
}
