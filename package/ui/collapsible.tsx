"use client";

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

function Collapsible({
  asChild,
  render,
  children,
  ...props
}: CollapsiblePrimitive.Root.Props & { asChild?: boolean }) {
  const resolvedRender = asChild && React.isValidElement(children) ? children : render;
  const mergedProps = asChild ? props : { children, ...props };
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      render={resolvedRender}
      {...mergedProps}
    />
  )
}

function CollapsibleTrigger({
  asChild,
  render,
  children,
  ...props
}: CollapsiblePrimitive.Trigger.Props & { asChild?: boolean }) {
  const resolvedRender = asChild && React.isValidElement(children) ? children : render;
  const mergedProps = asChild ? props : { children, ...props };
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      render={resolvedRender}
      {...mergedProps}
    />
  )
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
