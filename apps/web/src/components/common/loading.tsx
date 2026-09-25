import { cn } from "@/lib/utils";

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[60vh] w-full items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}
