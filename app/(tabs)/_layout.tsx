import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, router } from "expo-router";
import React, { useEffect, useState } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LEVEL_OPTIONS, TARGET_LEVEL_STORAGE_KEY } from "@/constants/opic";
import { ThemeColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [checkingLevel, setCheckingLevel] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const ensureLevelSelected = async () => {
      try {
        const storedLevel = await AsyncStorage.getItem(
          TARGET_LEVEL_STORAGE_KEY
        );

        const hasValidLevel = LEVEL_OPTIONS.some(
          (option) => option.id === storedLevel
        );

        if (!hasValidLevel) {
          router.replace("/onboarding");
          return;
        }

        if (isMounted) {
          setCheckingLevel(false);
        }
      } catch (error) {
        console.error("Failed to check target level", error);

        if (isMounted) {
          setCheckingLevel(false);
        }
      }
    };

    ensureLevelSelected();

    return () => {
      isMounted = false;
    };
  }, []);

  if (checkingLevel) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ThemeColors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Practice",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="mic.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="checkmark.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
