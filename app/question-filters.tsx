import { router } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LEVEL_OPTIONS } from "@/constants/opic";
import { useQuestionFilters } from "@/hooks/use-question-filters";
import { useQuestions } from "@/hooks/use-questions";

const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    className={`rounded-full border px-4 py-2 ${
      active
        ? "border-primary-500 bg-primary-100"
        : "border-gray-300 bg-white"
    }`}
  >
    <Text
      className={`text-sm font-semibold ${
        active ? "text-primary-700" : "text-gray-700"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function QuestionFiltersScreen() {
  const {
    filters,
    loadingFilters,
    updateCategory,
    updateLevel,
    toggleTag,
    clearFilters,
  } = useQuestionFilters();
  const { questions, loading } = useQuestions();

  const categories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => set.add(q.category));
    return Array.from(set);
  }, [questions]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => q.tags?.forEach((tag: string) => set.add(tag)));
    return Array.from(set);
  }, [questions]);

  if (loading || loadingFilters) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2563eb" />
        <Text className="mt-2 text-sm text-gray-600">필터 데이터를 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-10 pt-6"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-semibold text-gray-900">
          문제 필터 선택
        </Text>
        <Text className="mt-2 text-sm text-gray-600">
          카테고리, 태그, 난이도에 맞춰 질문을 골라 보여줍니다. 설정은 자동으로 저장됩니다.
        </Text>
        {questions.length === 0 && (
          <View className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <Text className="text-sm font-semibold text-amber-800">
              Firestore에 등록된 문제가 없습니다.
            </Text>
            <Text className="mt-1 text-xs text-amber-700">
              Admin Seed 화면에서 questions.json을 업로드한 뒤 다시 시도하세요.
            </Text>
          </View>
        )}

        <View className="mt-6">
          <Text className="text-sm font-semibold text-gray-800">카테고리</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Chip
              label="전체"
              active={!filters.category}
              onPress={() => updateCategory(null)}
            />
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                active={filters.category === category}
                onPress={() =>
                  updateCategory(filters.category === category ? null : category)
                }
              />
            ))}
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-sm font-semibold text-gray-800">태그</Text>
          <Text className="mt-1 text-xs text-gray-500">
            여러 개를 선택할 수 있습니다. 선택 시 해당 태그가 포함된 문제만 노출됩니다.
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {tags.map((tag) => {
              const active = filters.tags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  activeOpacity={0.85}
                  onPress={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-2 ${
                    active
                      ? "border-emerald-500 bg-emerald-100"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-emerald-700" : "text-gray-700"
                    }`}
                  >
                    #{tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-sm font-semibold text-gray-800">
            문제 레벨 (목표 레벨과 다르게 설정 가능)
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Chip
              label="목표 레벨 사용"
              active={!filters.level}
              onPress={() => updateLevel(null)}
            />
            {LEVEL_OPTIONS.map((level) => (
              <Chip
                key={level.id}
                label={level.title}
                active={filters.level === level.id}
                onPress={() =>
                  updateLevel(filters.level === level.id ? null : level.id)
                }
              />
            ))}
          </View>
        </View>

        <View className="mt-10 flex-row items-center justify-between gap-3">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={clearFilters}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3"
          >
            <Text className="text-center text-sm font-semibold text-gray-700">
              필터 초기화
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.back()}
            className="flex-1 rounded-xl bg-primary-600 px-4 py-3"
          >
            <Text className="text-center text-sm font-semibold text-white">
              적용하고 닫기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
