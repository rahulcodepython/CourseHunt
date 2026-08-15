"use client";

import * as React from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplay = (val: string) => {
    if (!val) return placeholder;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return val;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full justify-start text-left font-normal h-9 px-3",
          !value && "text-muted-foreground",
        )}
      >
        <Icon name="clock" className="mr-2 size-4 opacity-70" />
        <span className="truncate text-xs sm:text-sm">{formatDisplay(value)}</span>
      </Button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover p-3 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date & Time Picker
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                <Icon name="x" className="size-3.5" />
              </Button>
            </div>

            <Input
              type="datetime-local"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="bg-background text-sm"
            />

            <div className="flex flex-wrap gap-1 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 text-[11px] px-2"
                onClick={() => {
                  const now = new Date();
                  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                  onChange(now.toISOString().slice(0, 16));
                }}
              >
                Now
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 text-[11px] px-2"
                onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 1);
                  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                  onChange(d.toISOString().slice(0, 16));
                }}
              >
                +1 Hour
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 text-[11px] px-2"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(2, 0, 0, 0);
                  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                  onChange(d.toISOString().slice(0, 16));
                }}
              >
                Tomorrow 2 AM
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
