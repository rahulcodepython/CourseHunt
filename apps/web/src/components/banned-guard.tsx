"use client";

import { useSession } from "@package/auth/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function BannedGuard({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isPending && session && session.user.banned) {
			if (pathname !== "/restricted") {
				router.push("/restricted");
			}
		}
	}, [session, isPending, router, pathname]);

	if (!isPending && session && session.user.banned && pathname !== "/restricted") {
		return null; // prevent rendering before redirect
	}

	return <>{children}</>;
}
