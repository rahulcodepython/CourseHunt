"use client";

import { Icon } from "@/components/icon";


import { Separator } from "@/components/ui/separator";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";

import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RestrictedPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (!isPending && session) {
			if (!session.user.banned) {
				router.push("/");
			}
		}
	}, [session, isPending, router]);

	if (isPending) return <Loading />;

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
			<Icon name="IconShieldExclamation" className="w-24 h-24 text-destructive mb-6" />
			<h1 className="text-4xl font-bold tracking-tight mb-4">Account Suspended</h1>
			<p className="text-muted-foreground text-lg max-w-md mb-8 leading-relaxed">
				Your account has been temporarily or permanently restricted due to a violation of our terms of service. 
				If you believe this is a mistake, please contact support.
			</p>
			<Button variant="outline" onClick={() => window.location.href = "mailto:support@coursehunt.com"}>
				Contact Support
			</Button>
		</div>
	);
}
