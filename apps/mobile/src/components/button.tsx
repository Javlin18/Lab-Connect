import { ActivityIndicator, Pressable, Text } from "react-native";

import { cn } from "@/lib/cn";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  textClassName?: string;
  variant?: "danger" | "ghost" | "outline" | "primary";
};

const variants = {
  danger: "bg-danger",
  ghost: "bg-transparent",
  outline: "border border-line bg-white",
  primary: "bg-brand"
} as const;

const textVariants = {
  danger: "text-white",
  ghost: "text-brand",
  outline: "text-ink",
  primary: "text-white"
} as const;

export function Button({
  children,
  className,
  disabled,
  loading,
  onPress,
  textClassName,
  variant = "primary"
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        "min-h-12 flex-row items-center justify-center rounded-2xl px-4",
        variants[variant],
        disabled && "opacity-50",
        className
      )}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? <ActivityIndicator color={variant === "outline" ? "#101828" : "#FFFFFF"} /> : null}
      <Text
        className={cn(
          "text-base font-semibold",
          textVariants[variant],
          loading && "ml-2",
          textClassName
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}
