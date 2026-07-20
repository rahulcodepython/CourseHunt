"use client";

import { useSession } from "@package/auth/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface SessionUser {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	banned?: boolean;
}

export function BannedGuard({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const pathname = usePathname();
	const userBanned = (session?.user as SessionUser)?.banned;

	useEffect(() => {
		if (!isPending && session && userBanned) {
			if (pathname !== "/restricted") {
				router.push("/restricted");
			}
		}
	}, [session, userBanned, isPending, router, pathname]);

	if (!isPending && session && userBanned && pathname !== "/restricted") {
		return null;
	}

	return <>{children}</>;
}
