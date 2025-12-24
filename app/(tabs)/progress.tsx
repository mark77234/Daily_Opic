import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  loadPracticeHistory,
  type PracticeHistoryEntry,
} from "@/utils/practice-history";

export default function ProgressScreen() {
  const [history, setHistory] = useState<PracticeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshHistory = useCallback(async () => {
    setLoading(true);
    const items = await loadPracticeHistory();
    setHistory(items);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshHistory();
    }, [refreshHistory])
  );

  const totals = useMemo(
    () =>
      history.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.evaluationLevel] = (acc[entry.evaluationLevel] ?? 0) + 1;
        return acc;
      }, {}),
    [history]
  );

  const lastEntry = history[0];
  const handleOpenDetail = useCallback((entryId: string) => {
    router.push({ pathname: "/history/[id]", params: { id: entryId } });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        bounces={false}
        contentContainerClassName="flex-grow px-6 pb-10 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-semibold text-gray-900">통계</Text>

        {loading ? (
          <View className="mt-6 min-h-[140px] items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <ActivityIndicator color="#2563eb" />
            <Text className="text-sm text-gray-600">기록을 불러오는 중...</Text>
          </View>
        ) : (
          <>
            <View className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-6">
              {history.length === 0 ? (
                <Text className="text-center text-sm text-gray-400">
                  아직 연습 기록이 없습니다.
                </Text>
              ) : (
                <View className="flex-row flex-wrap gap-3">
                  <View className="flex-1 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      총 시도
                    </Text>
                    <Text className="mt-1 text-2xl font-bold text-gray-900">
                      {history.length}회
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      최근 등급
                    </Text>
                    <Text className="mt-1 text-2xl font-bold text-indigo-600">
                      {lastEntry?.evaluationLevel ?? "-"}
                    </Text>
                    <Text className="text-[11px] font-semibold text-gray-600">
                      목표: {lastEntry?.targetLevel ?? "미설정"}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      카테고리
                    </Text>
                    <Text className="mt-1 text-base font-semibold text-gray-900">
                      {lastEntry?.category ?? "-"}
                    </Text>
                    <Text className="text-[11px] font-semibold text-gray-600">
                      {lastEntry?.questionLevel
                        ? `문제 레벨: ${lastEntry.questionLevel}`
                        : ""}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View className="mt-10">
              <Text className="text-xl font-semibold text-gray-900">
                최근 기록
              </Text>
              {history.length === 0 ? (
                <View className="mt-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-5">
                  <Text className="text-center text-sm font-semibold text-gray-500">
                    No practice sessions yet.
                  </Text>
                  <Text className="mt-1 text-center text-xs text-primary-600">
                    Go to Practice to start practicing!
                  </Text>
                </View>
              ) : (
                <View className="mt-4 space-y-3">
                  {history.slice(0, 8).map((entry) => (
                    <TouchableOpacity
                      key={entry.id}
                      activeOpacity={0.9}
                      onPress={() => handleOpenDetail(entry.id)}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                          {new Date(entry.createdAt).toLocaleString()}
                        </Text>
                        <Text className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                          {entry.evaluationLevel}
                        </Text>
                      </View>
                      <Text className="mt-2 text-sm font-semibold text-gray-900">
                        {entry.questionText}
                      </Text>
                      <Text className="mt-1 text-xs text-gray-600">
                        카테고리: {entry.category} · 문제 레벨:{" "}
                        {entry.questionLevel}
                      </Text>
                      <Text
                        numberOfLines={3}
                        className="mt-2 text-sm leading-5 text-gray-800"
                      >
                        {entry.transcript}
                      </Text>
                      {entry.tags?.length ? (
                        <View className="mt-2 flex-row flex-wrap gap-2">
                          {entry.tags.slice(0, 4).map((tag) => (
                            <Text
                              key={tag}
                              className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700"
                            >
                              #{tag}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {history.length > 0 && (
              <View className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <Text className="text-sm font-semibold text-gray-800">
                  등급 분포
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {Object.entries(totals).map(([level, count]) => (
                    <View
                      key={level}
                      className="rounded-full bg-white px-3 py-2 shadow-sm"
                    >
                      <Text className="text-xs font-semibold text-gray-800">
                        {level}: {count}회
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
