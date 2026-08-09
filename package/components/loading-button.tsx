"use client";

import * as React from "react";
import { Icon } from "@package/components/icon";

import { cn } from "@package/lib/utils";
import { Button, type ButtonProps } from "@package/ui/button";

type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  loadingText?: string;
};

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn("relative", className)}
      {...props}
    >
      {loading && <Icon name="IconLoader" className="animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}

