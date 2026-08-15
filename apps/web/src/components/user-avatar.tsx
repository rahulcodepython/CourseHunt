import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
    name?: string | null;
    image?: string | null;
    className?: string;
    fallbackClassName?: string;
}

export default function UserAvatar({
    name,
    image,
    className = "size-8",
    fallbackClassName,
}: UserAvatarProps) {
    const displayName = name || "User";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <Avatar className={cn("shrink-0", className)}>
            {image ? <AvatarImage src={image} alt={displayName} /> : null}
            <AvatarFallback className={cn("bg-primary/10 text-xs font-semibold text-primary", fallbackClassName)}>
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}
