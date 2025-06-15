"use client"

import { Button } from "@/components/ui/button"
import { Coupon } from "@/types/coupon.type"
import { Plus } from "lucide-react"
import { useState } from "react"
import CouponCard from "./coupon-card"
import CouponModal from "./coupon-modal"

// const demoData: Coupon[] = [
//     {
//         _id: "1",
//         code: "SAVE20",
//         expiryDate: "2024-12-31",
//         usage: 45,
//         maxUsage: 100,
//         offerValue: 20,
//         isActive: true,
//         description: "Get 20% off on all products",
//     },
//     {
//         _id: "2",
//         code: "WELCOME15",
//         expiryDate: "2024-11-30",
//         usage: 23,
//         maxUsage: 50,
//         offerValue: 15,
//         isActive: true,
//         description: "Welcome discount for new users",
//     },
//     {
//         _id: "3",
//         code: "FLASH30",
//         expiryDate: "2024-10-15",
//         usage: 89,
//         maxUsage: 200,
//         offerValue: 30,
//         isActive: false,
//         description: "Flash sale discount",
//     },
//     {
//         _id: "4",
//         code: "STUDENT10",
//         expiryDate: "2025-06-30",
//         usage: 156,
//         maxUsage: 500,
//         offerValue: 10,
//         isActive: true,
//         description: "Student discount program",
//     },
//     {
//         _id: "5",
//         code: "HOLIDAY25",
//         expiryDate: "2024-12-25",
//         usage: 12,
//         maxUsage: 75,
//         offerValue: 25,
//         isActive: true,
//         description: "Holiday season special offer",
//     },
// ]

export default function CouponLayout({ initialCoupons }: { initialCoupons: Coupon[] }) {
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

    const handleDeleteCoupon = (_id: string) => {
        setCoupons(coupons.filter((coupon) => coupon._id !== _id))
    }

    const handleToggleActive = (_id: string) => {
        setCoupons(coupons.map((coupon) => (coupon._id === _id ? { ...coupon, isActive: !coupon.isActive } : coupon)))
    }

    const handleCreateCoupon = (couponData: Coupon) => {
        setCoupons([...coupons, couponData])
        setIsModalOpen(false)
        setEditingCoupon(null)
    }

    const handleEditCoupon = (couponData: Coupon) => {
        setCoupons(
            coupons.map((c) => (c._id === couponData._id ? couponData : c)),
        )
        setIsModalOpen(false)
        setEditingCoupon(null)
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Coupon Management</h1>
                    <p className="mt-2">Manage your discount codes and promotional offers</p>
                </div>
                <Button onClick={() => {
                    setEditingCoupon(null)
                    setIsModalOpen(true)
                }} className="flex items-center gap-2 text-white cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Create Coupon
                </Button>
            </div>

            {/* Coupons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                    <CouponCard
                        key={coupon._id}
                        coupon={coupon}
                        onEdit={(coupon: Coupon) => {
                            setEditingCoupon(coupon)
                            setIsModalOpen(true)
                        }}
                        onDelete={handleDeleteCoupon}
                        onToggleActive={handleToggleActive}
                    />
                ))}
            </div>

            {/* Empty State */}
            {coupons.length === 0 && (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No coupons found</h3>
                </div>
            )}

            {/* Modal */}
            <CouponModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingCoupon(null)
                }}
                onSave={editingCoupon ? handleEditCoupon : handleCreateCoupon}
                editingCoupon={editingCoupon}
            />
        </div>
    )
}
