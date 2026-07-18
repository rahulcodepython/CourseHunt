"use client";

import { Icon } from "@/components/icon";


import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <Icon name="IconCircleCheck" className="size-5" />
        ),
        info: (
          <Icon name="IconInfoCircle" className="size-5" />
        ),
        warning: (
          <Icon name="IconAlertTriangle" className="size-5" />
        ),
        error: (
          <Icon name="IconAlertOctagon" className="size-5" />
        ),
        loading: (
          <Icon name="IconLoader" className="size-5 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
