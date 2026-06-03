import { useRef, useState } from "react";
import { Animated, Dimensions, Modal, Pressable, Text, View } from "react-native";
import { router, usePathname } from "expo-router";

type MenuItem = {
  label: string;
  href: string;
};

type TopMenuProps = {
  items: MenuItem[];
  tintColor?: string;
};

export function TopMenu({ items, tintColor = "#111827" }: TopMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelWidth = Math.round(Dimensions.get("window").width * 0.54);
  const slide = useRef(new Animated.Value(-panelWidth)).current;

  const show = () => {
    setOpen(true);
    Animated.timing(slide, {
      toValue: 0,
      duration: 190,
      useNativeDriver: true,
    }).start();
  };

  const hide = () => {
    Animated.timing(slide, {
      toValue: -panelWidth,
      duration: 160,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  const goTo = (href: string) => {
    hide();
    router.push(href as never);
  };

  return (
    <View className="ml-3">
      <Pressable
        accessibilityLabel="Open menu"
        className="h-10 w-10 items-center justify-center rounded-full bg-white"
        onPress={show}
      >
        <View className="gap-1.5">
          <View className="h-0.5 w-6 rounded-full" style={{ backgroundColor: tintColor }} />
          <View className="h-0.5 w-6 rounded-full" style={{ backgroundColor: tintColor }} />
          <View className="h-0.5 w-6 rounded-full" style={{ backgroundColor: tintColor }} />
        </View>
      </Pressable>

      <Modal transparent visible={open} animationType="none" onRequestClose={hide}>
        <View className="flex-1 flex-row bg-black/30">
          <Animated.View
            className="h-full bg-white px-3 pt-16 shadow-lg"
            style={{
              width: panelWidth,
              transform: [{ translateX: slide }],
            }}
          >
            <Text className="mb-4 px-3 text-xl font-bold text-gray-950">Menu</Text>
            {items.map((item) => (
              <Pressable
                key={item.href}
                className="mb-1 rounded-lg px-3 py-3"
                style={{
                  backgroundColor: pathname === item.href ? `${tintColor}14` : "transparent",
                  borderLeftWidth: pathname === item.href ? 3 : 0,
                  borderLeftColor: tintColor,
                }}
                onPress={() => goTo(item.href)}
              >
                <Text className="text-base font-semibold" style={{ color: pathname === item.href ? tintColor : "#111827" }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
          <Pressable className="flex-1" onPress={hide} />
        </View>
      </Modal>
    </View>
  );
}
