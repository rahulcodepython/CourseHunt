"use client";

import { Icon } from "@/components/icon";


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useDeleteCouponMutation, useUpdateCouponMutation } from "@/hooks/api"
import { Coupon } from "@/types/coupon.type"

import { toast } from "sonner"

interface CouponCardProps {
    coupon: Coupon
    onEdit: (coupon: Coupon) => void
}

export default function CouponCard({ coupon, onEdit }: CouponCardProps) {
    const usagePercentage = (coupon.usage / coupon.maxUsage) * 100
    const isExpired = new Date(coupon.expiryDate) < new Date()

    const { updateCoupon } = useUpdateCouponMutation()

    const handleToggleActive = async (id: number, status: boolean) => {
        const responseData = await updateCoupon({
            id: id.toString(),
            data: {
                isActive: !status,
            }
        })

        if (responseData) {
            toast.success("Coupon status updated successfully")
        }
    }

    const getStatusBadge = () => {
        if (isExpired) {
            return <Badge variant="destructive">Expired</Badge>
        }
        if (!coupon.isActive) {
            return <Badge variant="secondary">Inactive</Badge>
        }
        return (
            <Badge variant="default" className="bg-green-500 text-white">
                Active
            </Badge>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    return (
        <Card className={`transition-all duration-200 hover:shadow-lg ${!coupon.isActive ? "opacity-75" : ""}`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold font-mono">{coupon.code}</h3>
                        {coupon.description && <p className="text-sm mt-1">{coupon.description}</p>}
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Offer Value */}
                <div className="flex items-center gap-2">
                    <Icon name="IconPercentage" className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">{coupon.offerValue}</span>
                    <span className="">OFF</span>
                </div>

                {/* Expiry Date */}
                <div className="flex items-center gap-2 ">
                    <Icon name="IconCalendar" className="h-5 w-5" />
                    <span className="text-sm">Expires: {formatDate(coupon.expiryDate)}</span>
                </div>

                {/* Usage Statistics */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Icon name="IconUsers" className="h-5 w-5" />
                            <span>Usage</span>
                        </div>
                        <span className="font-medium">
                            {coupon.usage}/{coupon.maxUsage}
                        </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-xs">{Math.round(usagePercentage)}% used</p>
                </div>
            </CardContent>

            <CardFooter className="pt-3 border-t">
                <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" onClick={() => onEdit(coupon)} className="flex-1 cursor-pointer">
                        <Icon name="IconEdit" className="h-3 w-3 mr-1" />
                        IconEdit
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => coupon._id && handleToggleActive(coupon._id, coupon.isActive)} className="flex-1 cursor-pointer">
                        {coupon.isActive ? (
                            <>
                                <Icon name="IconPower" className="h-3 w-3 mr-1" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <Icon name="IconPower" className="h-3 w-3 mr-1" />
                                Activate
                            </>
                        )}
                    </Button>
                    {
                        coupon._id && <DeleteButton id={coupon._id} />
                    }
                </div>
            </CardFooter>
        </Card>
    )
}

const DeleteButton = ({ id }: { id: number }) => {
    const { isPending, deleteCoupon } = useDeleteCouponMutation()

    const handleDelete = async (id: number) => {
        const responseData = await deleteCoupon(id.toString())

        if (responseData) {
            toast.success("Coupon deleted successfully")
        }
    }

    return <Button
        variant="outline"
        size="sm"
        onClick={() => id && handleDelete(id)}
        disabled={isPending}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
    >
        <Icon name="IconTrash" className="h-3 w-3" />
    </Button>
}
