"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useCouponsQuery, useUpdateCouponMutation, useDeleteCouponMutation } from "@package/query-hooks/coupons.api";
import { CouponModal } from "./coupon-modal";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import { formatDate } from "@package/lib/format";
import type { Coupon } from "@package/schema/coupons.types";

function isExpired(coupon: Coupon): boolean {
  return !!coupon.expires_at && new Date(coupon.expires_at) < new Date();
}

export default function CouponsPage() {
    const { data: raw, isLoading } = useCouponsQuery();
    const updateMutation = useUpdateCouponMutation();
    const deleteMutation = useDeleteCouponMutation();
    const coupons: Coupon[] = raw?.data?.data ?? [];

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

    if (isLoading || !raw?.data) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Coupons"
                    subtitle="Create and manage discount coupons"
                />
                <Loading />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Coupons"
                subtitle="Create and manage discount coupons"
                actions={
                    <Button onClick={openCreate}>
                        <Icon name="IconPlus" className="size-4" />
                        Create Coupon
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle>All Coupons</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {coupons.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
                            <Icon name="IconTicket" className="size-8 opacity-40" />
                            <p className="text-sm">No coupons available...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => {
                                    const expired = isExpired(coupon);
                                    return (
                                        <TableRow key={coupon.id}>
                                            <TableCell>
                                                <code className="font-mono text-sm font-bold tracking-wider">{coupon.code}</code>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-primary">{coupon.discount_percent}% OFF</span>
                                            </TableCell>
                                            <TableCell className="tabular-nums">
                                                {coupon.max_usage
                                                    ? `${coupon.usage_count ?? 0} / ${coupon.max_usage}`
                                                    : "∞"}
                                            </TableCell>
                                            <TableCell>
                                                {coupon.expires_at ? (
                                                    <span className={expired ? "text-destructive" : "text-muted-foreground"}>
                                                        {formatDate(coupon.expires_at)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {expired ? (
                                                    <Badge variant="destructive">Expired</Badge>
                                                ) : coupon.is_active ? (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => openEdit(coupon)}
                                                        aria-label="Edit coupon"
                                                    >
                                                        <Icon name="IconPencil" className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => handleToggleActive(coupon)}
                                                        aria-label={coupon.is_active ? "Deactivate coupon" : "Activate coupon"}
                                                    >
                                                        <Icon name={coupon.is_active ? "IconPlayerPause" : "IconPlayerPlay"} className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteId(coupon)}
                                                        aria-label="Delete coupon"
                                                    >
                                                        <Icon name="IconTrash" className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
