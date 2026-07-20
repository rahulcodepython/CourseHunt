"use client";

import { useSession } from "@package/auth/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Loading from "@package/components/loading";

interface SessionUser {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role?: string;
}

export function TutorGuard({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const pathname = usePathname();

	const user = session?.user as SessionUser | undefined;
	const userRole = user?.role;

	const isAuthRoute = pathname.startsWith("/login");
	const isPendingRoute = pathname.startsWith("/permission-pending");

	useEffect(() => {
		if (isPending) return;

		if (!user) {
			if (!isAuthRoute) router.push("/login");
			return;
		}

		if (userRole === "user" && !isPendingRoute) {
			router.push("/permission-pending");
			return;
		}

		if (userRole === "admin" && !isAuthRoute && !isPendingRoute) {
			return;
		}

		if (userRole !== "tutor" && userRole !== "admin") {
			if (!isPendingRoute && !isAuthRoute) {
				router.push("/permission-pending");
			}
		}
	}, [user, userRole, isPending, router, pathname, isAuthRoute, isPendingRoute]);

	if (isPending) return <Loading />;

	if (!user) {
		return isAuthRoute ? <>{children}</> : null;
	}

	if (userRole === "user" || (userRole !== "tutor" && userRole !== "admin")) {
		return isPendingRoute ? <>{children}</> : null;
	}

	return <>{children}</>;
}
