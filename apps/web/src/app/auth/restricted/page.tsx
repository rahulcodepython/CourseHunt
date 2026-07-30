"use client";

import { Icon } from "@package/components/icon";
import { Separator } from "@package/ui/separator";
import Loading from "@package/components/loading";
import { Button } from "@package/ui/button";
import { useSessionStore } from "@package/store/session.store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SessionUser {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	banned?: boolean;
}

export default function RestrictedPage() {
	const session = useSessionStore((s) => s.data);
	const isPending = useSessionStore((s) => s.isPending);
	const router = useRouter();
	const userBanned = (session?.user as SessionUser)?.banned;

	useEffect(() => {
		if (!isPending && session) {
			if (!userBanned) {
				router.push("/");
			}
		}
	}, [session, userBanned, isPending, router]);

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
