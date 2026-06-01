import { Text, TextInput, View } from "react-native";

import { cn } from "@/lib/cn";

type InputProps = React.ComponentProps<typeof TextInput> & {
  label?: string;
};

export function Input({ className, label, ...props }: InputProps) {
  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-medium text-slate-600">{label}</Text> : null}
      <TextInput
        className={cn(
          "min-h-12 rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink",
          className
        )}
        placeholderTextColor="#98A2B3"
        {...props}
      />
    </View>
  );
}
