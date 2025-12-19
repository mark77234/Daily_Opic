import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import {
  LEVEL_OPTIONS,
  LevelId,
  TARGET_LEVEL_STORAGE_KEY,
} from "@/constants/opic";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const [selectedLevel, setSelectedLevel] = useState<LevelId | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSavedLevel = async () => {
      try {
        const storedLevel = await AsyncStorage.getItem(
          TARGET_LEVEL_STORAGE_KEY
        );

        if (
          storedLevel &&
          LEVEL_OPTIONS.some((option) => option.id === storedLevel)
        ) {
          setSelectedLevel(storedLevel as LevelId);
        }
      } catch (error) {
        console.error("Failed to load saved target level", error);
      }
    };

    loadSavedLevel();
  }, []);

  const handleContinue = async () => {
    if (!selectedLevel || isSaving) return;

    try {
      setIsSaving(true);
      await AsyncStorage.setItem(TARGET_LEVEL_STORAGE_KEY, selectedLevel);
      router.replace("/");
    } catch (error) {
      console.error("Failed to save target level", error);
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-10 pt-8"
        bounces={false}
      >
        <View className="mb-8">
          <Text className="text-3xl font-semibold text-gray-900">
            목표 오픽 등급을 선택하세요
          </Text>
          <Text className="mt-3 text-base text-gray-600">
            선택한 목표는 이후 홈 화면에서 계속 확인할 수 있어요.
          </Text>
        </View>

        <View className="-mx-2 flex-row flex-wrap">
          {LEVEL_OPTIONS.map((level) => {
            const isActive = level.id === selectedLevel;

            return (
              <View key={level.id} className="w-1/2 px-2">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setSelectedLevel(level.id)}
                  className={`relative mb-4 rounded-2xl border p-4 ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                  style={{ height: 120 }}
                >
                  <View
                    className={`absolute right-3 top-3 h-5 w-5 rounded-full border-2 ${
                      isActive
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  />
                  <Text
                    className={`text-xl font-semibold ${
                      isActive ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {level.title}
                  </Text>
                  <Text
                    className={`mt-2 text-sm leading-5 ${
                      isActive ? "text-blue-700" : "text-gray-600"
                    }`}
                  >
                    {level.description}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View className="mt-10">
          <TouchableOpacity
            activeOpacity={selectedLevel ? 0.8 : 1}
            onPress={handleContinue}
            disabled={!selectedLevel || isSaving}
            className={`rounded-xl p-4 ${
              selectedLevel ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center text-lg font-semibold ${
                selectedLevel ? "text-white" : "text-gray-500"
              }`}
            >
              {isSaving ? "저장 중..." : "메인 화면으로 이동"}
            </Text>
          </TouchableOpacity>
          <Text className="mt-3 text-center text-xs text-gray-500">
            언제든 설정에서 목표 등급을 다시 선택할 수 있어요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
