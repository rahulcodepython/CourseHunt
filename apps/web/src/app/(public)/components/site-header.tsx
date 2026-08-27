"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";
import UserAvatar from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useSession from "@/hooks/use-session";
import { getDashboardURI, ROUTES } from "@/lib/const";

export function SiteHeader() {
  const router = useRouter();
  const { user, isPending, signOut } = useSession();

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      toast.success("Signed out");
      router.push(ROUTES.HOME);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={ROUTES.HOME} className="flex items-center gap-2 font-bold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon name="book" className="size-4.5" />
          </div>
          CourseHunt
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link href={ROUTES.HOME} className="text-muted-foreground transition-colors hover:text-foreground">
            Home
          </Link>
          <Link href="/courses" className="text-muted-foreground transition-colors hover:text-foreground">
            Courses
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!isPending && user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/student/wishlist" aria-label="Wishlist">
                  <Icon name="heart" className="size-4.5" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-2 rounded-full h-9 px-2">
                    <UserAvatar name={user.name} image={user.image} className="size-7 border" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardURI(user.role)} className="cursor-pointer">
                      <Icon name="dashboard" className="size-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
                    <Icon name="logout" className="size-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
