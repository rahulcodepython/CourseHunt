"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@package/ui/dropdown-menu";
import { signOut, useSession } from "@package/auth/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SessionUser {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role?: string;
}

export default function Header() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const userRole = (session?.user as SessionUser)?.role;

	const handleLogout = async () => {
		setIsLoggingOut(true);
		await signOut();
		toast.success("Logged out successfully");
		router.push("/");
	};

	return (
		<header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
			<nav className="container mx-auto px-4 py-2 flex items-center justify-between">
				<div className="flex items-center gap-6">
					<Link href="/" className="flex items-center gap-2">
						<Icon name="IconSearch" className="h-6 w-6 text-primary" />
						<span className="text-xl font-bold">CourseHunt</span>
					</Link>
					<div className="hidden md:flex items-center gap-6">
						<Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
						<Link href="/courses" className="text-sm font-medium hover:text-primary transition-colors">Courses</Link>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{!isPending && session ? (
						<>
							<Link href="/wishlist">
								<Button variant="ghost" size="icon" className="relative">
									<Icon name="IconHeart" className="h-5 w-5" />
								</Button>
							</Link>
							<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full">
									<Avatar className="h-8 w-8">
										<AvatarImage src={session.user.image || ""} alt={session.user.name} />
										<AvatarFallback>{session.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>
									<div className="flex flex-col">
										<span>{session.user.name}</span>
										<span className="text-xs text-muted-foreground font-normal">{session.user.email}</span>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuLabel>My Account</DropdownMenuLabel>
									<Link href="/dashboard"><DropdownMenuItem>Dashboard</DropdownMenuItem></Link>
									<Link href="/dashboard/profile"><DropdownMenuItem>Profile</DropdownMenuItem></Link>
									{userRole === "admin" && (
										<>
											<DropdownMenuSeparator />
											<a href="http://localhost:3002"><DropdownMenuItem>Admin Panel</DropdownMenuItem></a>
										</>
									)}
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout}>
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						</>
					) : (
						<Link href="/login">
							<Button variant="outline">Sign In</Button>
						</Link>
					)}
				</div>
			</nav>
		</header>
	);
}
