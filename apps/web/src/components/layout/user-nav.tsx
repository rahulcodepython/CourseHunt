"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import { Icon } from "@/components/icon";
import UserAvatar from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/store/session.store";
import { Button } from "@/components/ui/button";
import { ROUTES, ROLES } from "@/lib/const";
import useSession from "@/hooks/use-session";

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useSession();
  const user = useSessionStore((state) => state.user);
  const isAdminOrTutor = user?.role === ROLES.ADMIN || user?.role === ROLES.TUTOR;
  const profileHref = pathname.startsWith(ROUTES.TUTOR_DASHBOARD)
    ? `${ROUTES.TUTOR_DASHBOARD}/profile`
    : pathname.startsWith(ROUTES.STUDENT_DASHBOARD)
      ? `${ROUTES.STUDENT_DASHBOARD}/profile`
      : `${ROUTES.ADMIN_DASHBOARD}/profile`;

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      toast.success("Signed out");
      router.push(ROUTES.LOGIN);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative flex items-center gap-2 rounded-full h-9 px-2 focus:outline-none hover:bg-accent"
        >
          <UserAvatar name={user?.name ?? "Admin"} image={user?.image} className="size-7 border" />
          <span className="hidden text-sm font-medium sm:inline-block pr-1">
            {user?.name ?? "Admin"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium">{user?.name ?? "Admin"}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {user?.email ?? "Platform Administrator"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profileHref} className="cursor-pointer">
            <Icon name="user" className="size-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        {isAdminOrTutor && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.CHANGE_PASSWORD} className="cursor-pointer">
                <Icon name="lock" className="size-4 mr-2" />
                Change Password
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
          <Icon name="logout" className="size-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
