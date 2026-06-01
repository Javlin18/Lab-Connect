import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({
  children,
  scroll = true,
  subtitle,
  title,
  headerRight,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  subtitle?: string;
  title: string;
  headerRight?: React.ReactNode;
}) {
  const content = (
    <View className="flex-1 gap-4 px-5 pb-8">
      <View className="flex-row items-start justify-between pt-3">
        <View className="gap-1 flex-1">
          <Text className="text-3xl font-bold text-ink">{title}</Text>
          {subtitle ? <Text className="text-sm text-slate-500">{subtitle}</Text> : null}
        </View>
        {headerRight ? <View className="mt-1">{headerRight}</View> : null}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-mist" edges={["top"]}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}
