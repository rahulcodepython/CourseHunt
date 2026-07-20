"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Separator } from "@package/ui/separator";
import { useSession } from "@package/auth/auth-client";
import { useCheckoutCourseQuery, useInitiateTransactionMutation } from "@package/query-hooks/transactions.api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Loading from "@package/components/loading";
import Image from "next/image";

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function CheckoutPage() {
    const { _id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { data: course, isLoading } = useCheckoutCourseQuery(_id as string);
    const initiateMutation = useInitiateTransactionMutation();
    const [couponCode, setCouponCode] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    if (isLoading) return <Loading />;
    if (!course?.data) return <div className="text-center py-20">Course not found.</div>;

    const c = course.data;

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error("Failed to load payment gateway. Please try again.");
                setIsProcessing(false);
                return;
            }

            const result = await initiateMutation.execute({
                course_id: c.id,
                coupon_code: couponCode || null,
            });

            if (!result?.success || !result?.data) {
                setIsProcessing(false);
                return;
            }

            const { transaction_id, razorpay_order_id, amount, currency, razorpay_key } = result.data;

            const options = {
                key: razorpay_key,
                amount: amount * 100,
                currency,
                name: "CourseHunt",
                description: c.title,
                order_id: razorpay_order_id,
                prefill: { name: session?.user?.name || "", email: session?.user?.email || "" },
                handler: () => {
                    router.push(`/checkout/confirmation/${transaction_id}`);
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                        toast.error("Payment cancelled.");
                    },
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", (response: any) => {
                toast.error(response.error?.description || "Payment failed.");
                setIsProcessing(false);
            });
            rzp.open();
        } catch {
            toast.error("Payment failed. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold">Checkout</h1>
                            <p className="text-muted-foreground mt-2">Complete your purchase</p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    {c.image_url && (
                                        <Image src={c.image_url} alt={c.title} width={80} height={60} className="rounded-lg object-cover" />
                                    )}
                                    <div>
                                        <h3 className="font-semibold">{c.title}</h3>
                                        <p className="text-sm text-muted-foreground">{c.instructor?.name}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Course Price</span>
                                        <span>₹{c.final_price}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Original Price</span>
                                        <span className="line-through">₹{c.actual_price}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Have a Coupon?</CardTitle>
                                <CardDescription>Enter your coupon code to get a discount</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                    />
                                    <Button variant="outline" disabled={!couponCode}>Apply</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Payment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>₹{c.final_price}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Discount</span>
                                        <span>₹0</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>₹{c.final_price}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full text-white bg-green-600 hover:bg-green-700"
                                    size="lg"
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <><Icon name="IconLoader2" className="h-5 w-5 mr-2 animate-spin" />Processing...</>
                                    ) : (
                                        <><Icon name="IconLock" className="h-5 w-5 mr-2" />Pay ₹{c.final_price}</>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Secure payment processed by Razorpay
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
