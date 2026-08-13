"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

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
      {loading && <Loader2 className="animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
