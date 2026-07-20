"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@package/ui/card";
import { Progress } from "@package/ui/progress";
import { useDeleteCouponMutation, useUpdateCouponMutation } from "@package/query-hooks/coupons.api";
import { toast } from "sonner";

import type { Coupon } from "@package/schema/coupons.types";

interface CouponCardProps {
	coupon: Coupon;
	onEdit: (coupon: Coupon) => void;
}

export default function CouponCard({ coupon, onEdit }: CouponCardProps) {
	const usagePercentage = (coupon.usage_count / coupon.max_usage) * 100;
	const isExpired = new Date(coupon.expires_at) < new Date();
	const updateMutation = useUpdateCouponMutation();
	const deleteMutation = useDeleteCouponMutation();

	const handleToggleActive = async () => {
		await updateMutation.execute({ id: coupon.id, data: { is_active: !coupon.is_active } });
		toast.success("Coupon status updated successfully");
	};

	const handleDelete = async () => {
		await deleteMutation.execute(coupon.id);
		toast.success("Coupon deleted successfully");
	};

	const getStatusBadge = () => {
		if (isExpired) return <Badge variant="destructive">Expired</Badge>;
		if (!coupon.is_active) return <Badge variant="secondary">Inactive</Badge>;
		return <Badge variant="default" className="bg-green-500 text-white">Active</Badge>;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<Card className={`transition-all duration-200 hover:shadow-lg ${!coupon.is_active ? "opacity-75" : ""}`}>
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<div>
						<h3 className="text-xl font-bold font-mono">{coupon.code}</h3>
						{coupon.course?.title && <p className="text-sm mt-1">{coupon.discount_percent}% off on {coupon.course.title}</p>}
					</div>
					{getStatusBadge()}
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex items-center gap-2">
					<Icon name="IconPercentage" className="h-5 w-5 text-green-600" />
					<span className="text-2xl font-bold text-green-600">{coupon.discount_percent}</span>
					<span className="">OFF</span>
				</div>

				<div className="flex items-center gap-2">
					<Icon name="IconCalendar" className="h-5 w-5" />
					<span className="text-sm">Expires: {formatDate(coupon.expires_at)}</span>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<Icon name="IconUsers" className="h-5 w-5" />
							<span>Usage</span>
						</div>
						<span className="font-medium">{coupon.usage_count}/{coupon.max_usage}</span>
					</div>
					<Progress value={usagePercentage} className="h-2" />
					<p className="text-xs">{Math.round(usagePercentage)}% used</p>
				</div>
			</CardContent>

			<CardFooter className="pt-3 border-t">
				<div className="flex gap-2 w-full">
					<Button variant="outline" size="sm" onClick={() => onEdit(coupon)} className="flex-1 cursor-pointer">
						<Icon name="IconEdit" className="h-3 w-3 mr-1" />
						Edit
					</Button>
					<Button variant="outline" size="sm" onClick={handleToggleActive} className="flex-1 cursor-pointer">
						{coupon.is_active ? (
							<><Icon name="IconPower" className="h-3 w-3 mr-1" />Deactivate</>
						) : (
							<><Icon name="IconPower" className="h-3 w-3 mr-1" />Activate</>
						)}
					</Button>
					<Button variant="outline" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending} className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
						<Icon name="IconTrash" className="h-3 w-3" />
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
