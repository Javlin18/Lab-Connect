import { View } from "react-native";

import { cn } from "@/lib/cn";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("rounded-3xl border border-line bg-white p-4", className)}>{children}</View>;
}
