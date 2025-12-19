import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import {
  LEVEL_OPTIONS,
  LevelId,
  TARGET_LEVEL_STORAGE_KEY,
} from "@/constants/opic";

export default function HomeScreen() {
  const [targetLevel, setTargetLevel] = useState<LevelId | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadLevel = async () => {
        try {
          const storedLevel = await AsyncStorage.getItem(
            TARGET_LEVEL_STORAGE_KEY
          );
          const isValidLevel = LEVEL_OPTIONS.some(
            (option) => option.id === storedLevel
          );

          if (isMounted) {
            setTargetLevel(isValidLevel ? (storedLevel as LevelId) : null);
          }
        } catch (error) {
          console.error("Failed to load target level", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadLevel();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-base text-gray-600">선택한 목표 등급</Text>
      <Text className="mt-2 text-4xl font-bold text-primary-600">
        {loading ? "불러오는 중..." : (targetLevel ?? "미설정")}
      </Text>
      <Text className="mt-4 text-center text-sm text-gray-500">
        {targetLevel
          ? "이 목표를 기준으로 학습을 진행해요."
          : "설정에서 목표 등급을 선택하고 시작하세요."}
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/onboarding")}
        className="mt-8 w-full rounded-xl border border-primary-600 bg-white p-4"
      >
        <Text className="text-center text-base font-semibold text-primary-600">
          목표 등급 다시 선택하기
        </Text>
      </TouchableOpacity>
    </View>
  );
}
