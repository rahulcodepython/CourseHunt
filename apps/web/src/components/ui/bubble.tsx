import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const bubbleVariants = cva(
  "relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground rounded-bottom-left-xs",
        secondary: "bg-secondary text-secondary-foreground rounded-bottom-left-xs",
        muted: "bg-muted text-muted-foreground border rounded-top-left-xs",
        outline: "border bg-background text-foreground shadow-xs rounded-top-left-xs",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

export interface BubbleProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bubbleVariants> {}

function Bubble({ className, variant, ...props }: BubbleProps) {
  return (
    <div data-slot="bubble" className={cn(bubbleVariants({ variant }), className)} {...props} />
  );
}

function BubbleContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="bubble-content"
      className={cn("leading-relaxed break-words", className)}
      {...props}
    />
  );
}

function BubbleHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="bubble-header"
      className={cn(
        "mb-1 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function BubbleFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="bubble-footer"
      className={cn("mt-1.5 flex items-center gap-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Bubble, BubbleContent, BubbleHeader, BubbleFooter, bubbleVariants };
