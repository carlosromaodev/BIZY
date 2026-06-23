import React from "react";
import { Pressable, Text, ActivityIndicator, type ViewStyle } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-bizy active:opacity-90",
  {
    variants: {
      variant: {
        default: "bg-bizy-ink-market",
        primary: "bg-bizy-green",
        outline: "border border-bizy-line bg-bizy-surface",
        ghost: "bg-transparent",
        destructive: "bg-bizy-rose",
        link: "bg-transparent",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-9 px-3",
        lg: "h-14 px-6",
        icon: "h-10 w-10",
        pill: "h-10 px-4 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const textVariants = cva("text-bizy-base font-semibold", {
  variants: {
    variant: {
      default: "text-white",
      primary: "text-white",
      outline: "text-bizy-ink",
      ghost: "text-bizy-ink",
      destructive: "text-white",
      link: "text-bizy-green",
    },
    size: {
      default: "",
      sm: "text-bizy-sm",
      lg: "text-lg",
      icon: "",
      pill: "text-bizy-sm font-bold",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant,
  size,
  onPress,
  disabled,
  loading,
  className,
  textClassName,
  style,
  icon,
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        disabled && "opacity-50",
        className
      )}
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#17211C" : "#FFFFFF"}
        />
      ) : (
        <>
          {icon}
          {typeof children === "string" ? (
            <Text className={cn(textVariants({ variant, size }), textClassName)}>
              {children}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}
