import { Platform, ScrollView, StatusBar, Text, View } from "react-native";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;

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
    <View style={{ flex: 1, gap: 16, paddingHorizontal: 20, paddingBottom: 32 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingTop: 12,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          {title ? (
            <Text
              style={{ fontSize: 30, fontWeight: "700", color: "#101828" }}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={{ fontSize: 14, color: "#64748b" }}>{subtitle}</Text>
          ) : null}
        </View>
        {headerRight ? (
          <View style={{ marginTop: 4 }}>{headerRight}</View>
        ) : null}
      </View>
      {children}
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F2F4F7",
        paddingTop: STATUS_BAR_HEIGHT,
      }}
    >
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
