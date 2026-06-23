import React from "react";
import { View, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "flex-row items-center gap-1 self-start rounded-full px-2.5 py-0.5",
  {
    variants: {
      variant: {
        green: "bg-bizy-green-tint",
        amber: "bg-bizy-amber-tint",
        blue: "bg-bizy-blue-tint",
        rose: "bg-bizy-rose-tint",
        violet: "bg-bizy-violet-tint",
        muted: "bg-bizy-muted",
        solid: "bg-bizy-green",
      },
    },
    defaultVariants: {
      variant: "green",
    },
  }
);

const textVariants = cva("text-bizy-xs font-semibold", {
  variants: {
    variant: {
      green: "text-bizy-green",
      amber: "text-bizy-amber-ink",
      blue: "text-bizy-blue-ink",
      rose: "text-bizy-rose-ink",
      violet: "text-bizy-violet-ink",
      muted: "text-bizy-ink-3",
      solid: "text-white",
    },
  },
  defaultVariants: {
    variant: "green",
  },
});

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: string;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant, dot, className }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      {dot && (
        <View
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "green" && "bg-bizy-green",
            variant === "amber" && "bg-bizy-amber",
            variant === "blue" && "bg-bizy-blue",
            variant === "rose" && "bg-bizy-rose",
            variant === "violet" && "bg-bizy-violet",
            variant === "muted" && "bg-bizy-ink-4",
            variant === "solid" && "bg-white"
          )}
        />
      )}
      <Text className={textVariants({ variant })}>{children}</Text>
    </View>
  );
}
