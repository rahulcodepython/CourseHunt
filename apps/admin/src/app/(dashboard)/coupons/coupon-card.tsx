"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Progress } from "@package/ui/progress";
import { useUpdateCouponMutation, useDeleteCouponMutation } from "@package/query-hooks/coupons.api";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { useState } from "react";

export function CouponCard({ coupon, onEdit }: { coupon: any; onEdit: () => void }) {
    const updateMutation = useUpdateCouponMutation();
    const deleteMutation = useDeleteCouponMutation();

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
    const usagePercent = coupon.max_usage ? Math.min((coupon.usage_count / coupon.max_usage) * 100, 100) : 0;

    const statusBadge = isExpired ? "destructive" : coupon.is_active ? "secondary" : "outline";
    const statusLabel = isExpired ? "Expired" : coupon.is_active ? "Active" : "Inactive";

    const handleToggleActive = async () => {
        await updateMutation.execute({ id: coupon.id, data: { is_active: !coupon.is_active } });
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.execute(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <>
            <Card className="relative overflow-hidden">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <code className="text-lg font-bold tracking-wider">{coupon.code}</code>
                            <p className="text-2xl font-bold text-primary mt-1">{coupon.discount_percent}% OFF</p>
                        </div>
                        <Badge variant={statusBadge as any} className={statusLabel === "Active" ? "bg-green-100 text-green-800" : ""}>
                            {statusLabel}
                        </Badge>
                    </div>

                    {coupon.expires_at && (
                        <p className="text-xs text-muted-foreground">
                            Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                        </p>
                    )}

                    {coupon.max_usage > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Usage: {coupon.usage_count || 0} / {coupon.max_usage}</span>
                                <span>{Math.round(usagePercent)}%</span>
                            </div>
                            <Progress value={usagePercent} />
                        </div>
                    )}

                    <div className="flex gap-1 pt-1">
                        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                            <Icon name="IconPencil" className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={handleToggleActive}>
                            <Icon name={(coupon.is_active ? "IconPause" : "IconPlay") as any} className="mr-1 h-3 w-3" />
                            {coupon.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(coupon.id)}>
                            <Icon name="IconTrash" className="h-3 w-3" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Coupon"
                description="Are you sure you want to delete this coupon? This action cannot be undone."
                isLoading={deleteMutation.isPending}
            />
        </>
    );
}
