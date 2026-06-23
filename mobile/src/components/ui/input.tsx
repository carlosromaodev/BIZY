import React from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName,
  className,
  ...props
}: InputProps) {
  return (
    <View className={cn("gap-1.5", containerClassName)}>
      {label && (
        <Text className="text-bizy-sm font-semibold text-bizy-ink">{label}</Text>
      )}
      <TextInput
        className={cn(
          "h-12 rounded-bizy border border-bizy-line bg-bizy-surface px-4 text-bizy-base text-bizy-ink",
          error && "border-bizy-rose",
          className
        )}
        placeholderTextColor="#9AA39E"
        {...props}
      />
      {error && (
        <Text className="text-bizy-xs text-bizy-rose">{error}</Text>
      )}
    </View>
  );
}
