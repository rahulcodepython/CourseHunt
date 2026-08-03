import { Skeleton } from "@package/ui/skeleton";
import { cn } from "@package/lib/utils";

export default function Loading() {
    return (
        <div className="w-full min-h-[400px] p-6 space-y-6">
            <div className="space-y-4">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-4 w-[250px]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] w-full items-center justify-center",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}
