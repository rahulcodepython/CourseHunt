"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/common/icon";
import { cn } from "@/lib/utils/utils";

/** Three-dot dropdown menu for a DataTable "actions" column. */
export function RowActions({
  children,
  triggerLabel = "Actions",
}: {
  children: React.ReactNode;
  triggerLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label={triggerLabel}
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{triggerLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function RowActionButton({
  icon,
  label,
  onClick,
  href,
  destructive,
  className,
  iconClassName,
  disabled,
}: {
  icon?: IconName;
  label: string;
  onClick?: () => void;
  /** Renders as a Link instead of a click handler (e.g. "view details" actions). */
  href?: string;
  destructive?: boolean;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
}) {
  const content = (
    <React.Fragment>
      {icon && (
        <Icon
          name={icon}
          className={cn(
            "mr-2 size-4 shrink-0",
            destructive ? "text-destructive" : "text-muted-foreground",
            iconClassName,
          )}
        />
      )}
      <span className={cn("truncate", destructive && "text-destructive")}>{label}</span>
    </React.Fragment>
  );

  if (href) {
    return (
      <DropdownMenuItem asChild disabled={disabled} className={className}>
        <Link href={href} className="flex w-full items-center cursor-pointer">
          {content}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "cursor-pointer",
        destructive && "text-destructive focus:text-destructive focus:bg-destructive/10",
        className,
      )}
    >
      {content}
    </DropdownMenuItem>
  );
}
