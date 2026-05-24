"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

function Item({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="item"
      className={cn(
        "group/item relative flex min-w-0 items-start gap-3 rounded-2xl border bg-background/80 p-3 text-left transition-all duration-300 hover:border-primary/25 hover:bg-primary/5 hover:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function ItemMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-media"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover/item:bg-primary group-hover/item:text-primary-foreground",
        className
      )}
      {...props}
    />
  );
}

function ItemContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn("min-w-0 flex-1 space-y-1", className)}
      {...props}
    />
  );
}

function ItemTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn("text-sm font-black leading-5 text-foreground", className)}
      {...props}
    />
  );
}

function ItemDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

function ItemActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle };
