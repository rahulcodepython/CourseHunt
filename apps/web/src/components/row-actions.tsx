"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Icon, type IconName } from "@/components/icon";
import { cn } from "@/lib/utils";

/** Right-aligned row of icon action buttons for a DataTable "actions" column. */
export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export function RowActionButton({
  icon,
  label,
  onClick,
  href,
  destructive,
  className,
  iconClassName,
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  /** Renders as a Link instead of a click handler (e.g. "view details" actions). */
  href?: string;
  destructive?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  const iconEl = <Icon name={icon} className={cn("size-4", iconClassName)} />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "size-8",
            destructive && "text-destructive hover:text-destructive",
            className,
          )}
          onClick={onClick}
          aria-label={label}
          asChild={Boolean(href)}
        >
          {href ? <Link href={href}>{iconEl}</Link> : iconEl}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
