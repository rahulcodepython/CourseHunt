"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Icon name="ban" className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Try again, or reload the page if the problem persists.
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={reset}>
            <Icon name="refresh" className="size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
