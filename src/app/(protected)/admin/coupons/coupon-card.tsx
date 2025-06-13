"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Coupon } from "@/types/coupon.type"
import { Calendar, Edit, Percent, Power, PowerOff, Trash2, Users } from "lucide-react"

interface CouponCardProps {
    coupon: Coupon
    onEdit: (coupon: Coupon) => void
    onDelete: (id: string) => void
    onToggleActive: (id: string) => void
}

export default function CouponCard({ coupon, onEdit, onDelete, onToggleActive }: CouponCardProps) {
    const usagePercentage = (coupon.usage / coupon.maxUsage) * 100
    const isExpired = new Date(coupon.expiryDate) < new Date()

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
                    <Percent className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">{coupon.offerValue}</span>
                    <span className="">OFF</span>
                </div>

                {/* Expiry Date */}
                <div className="flex items-center gap-2 ">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Expires: {formatDate(coupon.expiryDate)}</span>
                </div>

                {/* Usage Statistics */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
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
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => onToggleActive(coupon.id)} className="flex-1 cursor-pointer">
                        {coupon.isActive ? (
                            <>
                                <PowerOff className="h-3 w-3 mr-1" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <Power className="h-3 w-3 mr-1" />
                                Activate
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(coupon.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
