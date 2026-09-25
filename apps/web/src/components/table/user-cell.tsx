import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export interface UserCellProps {
  name?: string | null;
  image?: string | null;
  email?: string | null;
  className?: string;
  avatarSize?: string;
  showName?: boolean;
  showEmail?: boolean;
}

export default function UserCell({
  name,
  image,
  email,
  className,
  avatarSize = "size-8",
  showName = true,
  showEmail = false,
}: UserCellProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <UserAvatar name={name} image={image} className={avatarSize} />
      {(showName || showEmail) && (
        <div className="flex flex-col min-w-0">
          {showName && <span className="font-medium truncate">{name || "User"}</span>}
          {showEmail && email && (
            <span className="text-xs text-muted-foreground truncate">{email}</span>
          )}
        </div>
      )}
    </div>
  );
}
