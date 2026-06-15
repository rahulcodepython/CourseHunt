"use client";

import { Icon } from "@/components/icon";


import type React from "react"

import LoadingButton from "@/components/loading-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    useCheckCouponMutation,
    useCheckoutInfoQuery,
    usePurchaseCourseMutation,
} from "@/hooks/api"
import {
    CheckoutCourseType,
    CheckoutUserType,
    PurchaseCourseDataType,
} from "@/types/purchase.type"
import { TransactionType } from "@/types/transaction.type"
import { CouponType } from "@/types/coupon.type"

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function CheckoutPage() {
    const [appliedCoupon, setAppliedCoupon] = useState<CouponType | null>(null)
    const [formData, setFormData] = useState<CheckoutUserType>({
        _id: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zip: "",
        country: "",
    })
    const [course, setCourse] = useState<CheckoutCourseType>({
        _id: 0,
        title: "",
        price: 0,
        originalPrice: 0,
        imageUrl: { url: "", fileType: "" },
        category: "",
    })
    const [finalPrice, setFinalPrice] = useState(0)
    const [coursePurchaseStatus, setCoursePurchaseStatus] = useState(false)
    const [transactionDetails, setTransactionDetails] = useState<TransactionType>({
        id: 0,
        _id: 0,
        transactionId: "",
        createdAt: "",
        courseId: 0,
        courseName: "",
        userId: "",
        userEmail: "",
        couponId: 0,
        couponCode: "",
        amount: 0,
    })

    const params = useParams()
    const courseId = params._id as string
    const checkoutInfoQuery = useCheckoutInfoQuery(courseId)
    const purchaseCourseMutation = usePurchaseCourseMutation()
    const isLoading = purchaseCourseMutation.isPending

    useEffect(() => {
        const responseData = checkoutInfoQuery.data

        if (responseData) {
            setCourse(responseData.course)
            setFinalPrice(responseData.course.price)
            setFormData(responseData.user)
        }
    }, [checkoutInfoQuery.data])

    useEffect(() => {
        if (appliedCoupon) {
            const discount = (appliedCoupon.offerValue / 100) * (course.price || 0)
            setFinalPrice((course.price || 0) - discount)
        } else {
            setFinalPrice(course.price || 0)
        }
    }, [appliedCoupon, course.price])


    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        const data: PurchaseCourseDataType = {
            ...formData,
            courseId: course._id,
            couponId: appliedCoupon?._id ?? undefined,
            price: finalPrice,
        }

        const responseData = await purchaseCourseMutation.purchaseCourse(data)

        if (responseData) {
            toast.success("Course purchased successfully!")
            setCoursePurchaseStatus(true)
            setTransactionDetails(responseData.transaction)
        }
    }

    return (
        coursePurchaseStatus ? <TransactionSuccessCard transaction={transactionDetails} /> : <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                        <Button variant="outline" className="cursor-pointer" onClick={() => window.history.back()}>
                            Back to Courses
                        </Button>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content */}

                        <div className="lg:col-span-2 space-y-8">
                            {/* Billing Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Icon name="IconUser" className="h-5 w-5" />
                                        Billing Information
                                    </CardTitle>
                                    <CardDescription>Please provide your billing details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <div className="relative">
                                                <Icon name="IconMail" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    className="pl-10"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                                    required
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">IconPhone Number</Label>
                                            <div className="relative">
                                                <Icon name="IconPhone" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    placeholder="+1 (555) 123-4567"
                                                    className="pl-10"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <div className="relative">
                                            <Icon name="IconMapPin" className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="address"
                                                placeholder="123 Main Street"
                                                className="pl-10"
                                                value={formData.address}
                                                onChange={(e) => handleInputChange("address", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                placeholder="New York"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange("city", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zipCode">ZIP Code</Label>
                                            <Input
                                                id="zipCode"
                                                placeholder="10001"
                                                value={formData.zip}
                                                onChange={(e) => handleInputChange("zip", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                placeholder="United States"
                                                value={formData.country}
                                                onChange={(e) => handleInputChange("country", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex gap-4">
                                        <Image
                                            src={course.imageUrl.url || "/placeholder.svg"}
                                            alt={course.title}
                                            width={80}
                                            height={60}
                                            className="rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm">{course.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {course.category}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Coupon Code */}
                                    <CouponForm setAppliedCoupon={setAppliedCoupon} courseId={courseId} />

                                    <Separator />

                                    {/* Price Breakdown */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Original Price</span>
                                            <span className="line-through text-muted-foreground">₹{course.originalPrice}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Course Price</span>
                                            <span>₹{course.price}</span>
                                        </div>
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Coupon Discount ({appliedCoupon.offerValue}%)</span>
                                                <span>-₹{((appliedCoupon.offerValue) / 100) * course.price}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span>₹{finalPrice}</span>
                                        </div>
                                        <div className="text-sm text-green-600 text-center">You save ₹{(course.originalPrice - finalPrice).toFixed(2)}!</div>
                                    </div>

                                    <LoadingButton isLoading={isLoading} title="Purchasing..." className="w-full">
                                        <Button className="w-full text-white bg-green-600 hover:bg-green-700 cursor-pointer"
                                            size="lg"
                                            onClick={handleSubmit}
                                        >
                                            <Icon name="IconLock" className="h-5 w-5 mr-2" />
                                            Complete Purchase
                                        </Button>
                                    </LoadingButton>

                                    <div className="text-xs text-muted-foreground text-center">
                                        <Icon name="IconLock" className="h-3 w-3 inline mr-1" />
                                        Secure checkout powered by SSL encryption
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const CouponForm = ({ setAppliedCoupon, courseId }: {
    setAppliedCoupon: React.Dispatch<React.SetStateAction<CouponType | null>>;
    courseId: string;
}) => {
    const [couponCode, setCouponCode] = useState("")
    const [applied, setApplied] = useState<boolean>(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    const { isPending, checkCoupon } = useCheckCouponMutation()

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setMessage({ text: "Please enter a coupon code", type: 'error' })
            return
        }

        const responseData = await checkCoupon(couponCode.toUpperCase())

        if (responseData) {
            if (responseData.applied && responseData.coupon) {
                setApplied(true)
                setAppliedCoupon(responseData.coupon)
                setMessage({ text: responseData.message, type: 'success' })
            } else {
                setMessage({ text: responseData.message, type: 'error' })
                setAppliedCoupon(null)
            }
        } else {
            setMessage({ text: "Failed to check coupon. Please try again.", type: 'error' })
        }
    }

    return <div className="space-y-3">
        <Label className="flex items-center gap-2">
            <Icon name="IconTag" className="h-5 w-5" />
            Coupon Code
        </Label>
        <div className="flex gap-2">
            <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => {
                    setCouponCode(e.target.value);
                    if (message) setMessage(null);
                }}
                className="uppercase"
                disabled={isPending || applied}
            />
            <Button
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={isPending || applied}
                className="min-w-[80px]"
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying
                    </>
                ) : applied ? "Applied" : "Apply"}
            </Button>
        </div>
        {
            message && (
                <div className={`text-sm flex items-center gap-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message.type === 'success' ? <Icon name="IconCircleCheck" className="h-3 w-3" /> : <Icon name="IconTag" className="h-3 w-3" />}
                    {message.text}
                </div>
            )
        }
    </div>
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
)

function TransactionSuccessCard({ transaction }: { transaction: TransactionType }) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full p-3">
                            <Icon name="IconCircleCheck" className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-green-700">Payment Successful!</CardTitle>
                    <CardDescription className="text-lg">Your transaction has been completed successfully</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Transaction Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon name="IconCreditCard" className="h-5 w-5 text-gray-500" />
                                <span className="font-medium">Transaction ID</span>
                            </div>
                            <div className="flex items-center gap-2 truncate">
                                <code className="px-2 py-1 rounded text-sm font-mono">
                                    {
                                        transaction.transactionId.length <= 30 ? transaction.transactionId : `${transaction.transactionId.slice(0, 30)}...`
                                    }
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => transaction.transactionId && copyToClipboard(transaction.transactionId)}
                                    className="h-6 w-6 p-0"
                                >
                                    <Icon name="IconCopy" className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon name="IconCalendar" className="h-5 w-5 text-gray-500" />
                                <span className="font-medium">Date & Time</span>
                            </div>
                            <span className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon name="IconTag" className="h-5 w-5 text-gray-500" />
                                <span className="font-medium">Amount</span>
                            </div>
                            <span className="text-xl font-bold text-green-600">₹{transaction.amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Course Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Icon name="IconBook" className="h-5 w-5" />
                            Course Details
                        </h3>

                        <div className="p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-lg">{transaction.courseName}</p>
                                    <p className="text-sm text-gray-500">Course ID: {transaction.courseId}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* IconUser Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Icon name="IconUser" className="h-5 w-5" />
                            IconUser Information
                        </h3>

                        <div className="p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Email:</span>
                                <span className="text-sm">{transaction.userEmail}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">IconUser ID:</span>
                                <span className="text-sm font-mono">{transaction.userId}</span>
                            </div>
                        </div>
                    </div>

                    {/* Coupon Details */}
                    {transaction.couponCode && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Icon name="IconTag" className="h-5 w-5" />
                                    Discount Applied
                                </h3>

                                <div className="p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Coupon Code:</span>
                                        <Badge variant="secondary" className="text-green-800">
                                            {transaction.couponCode}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Coupon ID:</span>
                                        <span className="text-sm font-mono">{transaction.couponId}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Link href={`/dashboard/study/${transaction.courseId}`} className="flex-1">
                            <Button className="w-full">Access Course</Button>
                        </Link>
                        <Button variant="outline" className="flex-1">
                            Download Receipt
                        </Button>
                    </div>
                </CardContent>

            </Card>
        </div>
    )
}
