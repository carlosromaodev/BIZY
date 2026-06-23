import React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-bizy border border-bizy-line-soft bg-bizy-surface",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn("border-b border-bizy-line px-4 py-3", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <View className={cn("px-4 py-3", className)} {...props}>
      {children}
    </View>
  );
}
