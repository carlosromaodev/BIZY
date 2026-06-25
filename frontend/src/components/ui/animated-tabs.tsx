"use client";

import * as React from "react";
import { LayoutGroup, motion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

type AnimatedTabsContextValue = {
  value: string;
};

const AnimatedTabsContext = React.createContext<AnimatedTabsContextValue>({ value: "" });

function Component({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internalValue, setInternalValue] = React.useState(String(defaultValue ?? ""));
  const currentValue = String(value ?? internalValue);

  function handleValueChange(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <AnimatedTabsContext.Provider value={{ value: currentValue }}>
      <LayoutGroup>
        <TabsPrimitive.Root
          data-slot="animated-tabs"
          value={currentValue}
          onValueChange={handleValueChange}
          className={cn("grid min-w-0 max-w-full gap-3", className)}
          {...props}
        />
      </LayoutGroup>
    </AnimatedTabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="animated-tabs-list"
      className={cn("relative grid min-w-0 max-w-full items-center rounded-2xl bg-muted p-1", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { value: currentValue } = React.useContext(AnimatedTabsContext);
  const active = currentValue === value;

  return (
    <TabsPrimitive.Trigger
      data-slot="animated-tabs-trigger"
      value={value}
      className={cn(
        "relative inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=active]:text-foreground",
        className
      )}
      {...props}
    >
      {active ? (
        <motion.span
          layoutId="animated-tabs-active"
          className="absolute inset-0 rounded-[inherit] bg-[var(--animated-tabs-active-bg,var(--background))] ring-1 ring-[var(--animated-tabs-active-ring,var(--border))]"
          transition={{ type: "tween", duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContents({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="animated-tabs-contents"
      className={cn("rounded-[1.35rem] border bg-background/80 p-4", className)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="animated-tabs-content"
      className={cn("min-w-0 max-w-full text-sm outline-none data-[state=inactive]:hidden", className)}
      {...props}
    >
      <motion.div
        className="min-w-0 max-w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </TabsPrimitive.Content>
  );
}

export { Component, TabsList, TabsTrigger, TabsContents, TabsContent };
