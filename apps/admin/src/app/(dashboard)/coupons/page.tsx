"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useCouponsQuery, useUpdateCouponMutation, useDeleteCouponMutation } from "@package/query-hooks/coupons.api";
import { CouponModal } from "./coupon-modal";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { useState } from "react";
import Loading from "@package/components/loading";
import type { Coupon } from "@package/schema/coupons.types";

export default function CouponsPage() {
    const { data: raw, isLoading } = useCouponsQuery();
    const updateMutation = useUpdateCouponMutation();
    const deleteMutation = useDeleteCouponMutation();
    const coupons: Coupon[] = raw?.data?.data ?? [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const openCreate = () => {
        setEditingCoupon(null);
        setIsModalOpen(true);
    };

    const openEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleToggleActive = async (coupon: Coupon) => {
        await updateMutation.execute({ id: coupon.id, data: { is_active: !coupon.is_active } });
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.execute(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Coupons</h1>
                    <p className="text-muted-foreground text-sm">Manage discount coupons</p>
                </div>
                <Button onClick={openCreate}>
                    <Icon name="IconPlus" className="mr-1 h-4 w-4" /> Create Coupon
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg">All Coupons</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8"><Loading /></div>
                    ) : coupons.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Icon name="IconTicket" className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p>No coupons available. Please create a new coupon.</p>
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
                                    const expired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
                                    return (
                                        <TableRow key={coupon.id}>
                                            <TableCell>
                                                <code className="font-mono font-bold text-sm tracking-wider">{coupon.code}</code>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-primary">{coupon.discount_percent}% OFF</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{coupon.usage_count || 0} / {coupon.max_usage || "∞"}</span>
                                            </TableCell>
                                            <TableCell>
                                                {coupon.expires_at ? (
                                                    <span className={`text-sm ${expired ? "text-destructive" : ""}`}>
                                                        {new Date(coupon.expires_at).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {expired ? (
                                                    <Badge variant="destructive">Expired</Badge>
                                                ) : coupon.is_active ? (
                                                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => openEdit(coupon)}>
                                                        <Icon name="IconPencil" className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(coupon)}>
                                                        <Icon name={(coupon.is_active ? "IconPause" : "IconPlay") as any} className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(coupon.id)}>
                                                        <Icon name="IconTrash" className="h-3 w-3" />
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
                description="Are you sure you want to delete this coupon? This action cannot be undone."
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
