import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { OpicEvaluationResult } from "@/utils/opic-evaluator";

type CompletedSectionProps = {
  evaluation: OpicEvaluationResult;
  displayedTranscript: string;
  feedbackTips: string[];
  sampleAnswer: string;
  onNextQuestion: () => void;
};

export function CompletedSection({
  evaluation,
  displayedTranscript,
  feedbackTips,
  sampleAnswer,
  onNextQuestion,
}: CompletedSectionProps) {
  const { level, totalScore, scores, notes, wordCount, sentenceCount } =
    evaluation;

  const metricRows = [
    {
      label: "문장 완성도",
      value: scores.sentenceCompletionRate,
      description: "완전한 주어+동사 문장 비율",
    },
    {
      label: "문장 복잡도",
      value: scores.sentenceComplexity,
      description: "복합·연결 절 활용도",
    },
    {
      label: "유창도",
      value: scores.fluencyScore,
      description: "군더더기·멈춤 제어",
    },
    {
      label: "어휘 다양성",
      value: scores.lexicalVariety,
      description: "고유 단어 비율",
    },
    {
      label: "문법 정확도",
      value: scores.grammarAccuracy,
      description: "오류 없는 전달",
    },
  ];

  return (
    <View className="mt-6 flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="rounded-3xl bg-slate-900 p-5 shadow-lg">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                OPIc 알고리즘 등급
              </Text>
              <Text className="mt-1 text-4xl font-extrabold text-amber-300">
                {level}
              </Text>
              <Text className="mt-1 text-xs font-semibold text-amber-100">
                가중 점수 {(totalScore * 100).toFixed(0)} / 100
              </Text>
              <Text className="mt-2 text-xs text-slate-300">
                규칙 기반 루브릭과 가중 특성을 STT 전사에 적용한 결과예요.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onNextQuestion}
              className="h-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2"
            >
              <Text className="text-base font-semibold text-slate-100">
                다음 질문
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <Text className="text-lg font-semibold text-amber-900">
            알고리즘 분석 결과
          </Text>
          <View className="mt-3">
            {metricRows.map((row) => {
              const widthPercent = Math.max(
                8,
                Math.min(100, Math.round(row.value * 100))
              );
              const width = `${widthPercent}%` as `${number}%`;

              return (
                <View key={row.label} className="mb-3">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm font-semibold text-amber-900">
                        {row.label}
                      </Text>
                      <Text className="text-xs text-amber-800">
                        {row.description}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-amber-900">
                      {(row.value * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View className="mt-1 h-2 w-full rounded-full bg-white/60">
                    <View
                      style={{ width }}
                      className="h-2 rounded-full bg-amber-500"
                    />
                  </View>
                </View>
              );
            })}
          </View>
          <View className="mt-1 flex-row flex-wrap gap-2">
            <View className="rounded-full bg-amber-200 px-3 py-1">
              <Text className="text-xs font-semibold text-amber-900">
                문장 수: {sentenceCount}
              </Text>
            </View>
            <View className="rounded-full bg-amber-200 px-3 py-1">
              <Text className="text-xs font-semibold text-amber-900">
                단어 수: {wordCount}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900">나의 답변</Text>
          <Text className="mt-3 text-base leading-6 text-gray-700">
            {`"${displayedTranscript}"`}
          </Text>
        </View>

        <View className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full bg-indigo-500" />
            <Text className="text-xl font-semibold text-indigo-900">
              평가 메모
            </Text>
          </View>
          <View className="mt-3">
            {notes.map((note, index) => {
              const spacing = index === 0 ? "" : "mt-2";

              return (
                <View
                  key={`${note}-${index}`}
                  className={`rounded-xl bg-white/80 px-3 py-2 ${spacing}`}
                >
                  <Text className="text-sm text-indigo-900">{note}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full bg-indigo-500" />
            <Text className="text-xl font-semibold text-indigo-900">
              피드백
            </Text>
          </View>
          <Text className="mt-3 text-base leading-6 text-indigo-900">
            현재 답변은 {level}에 매핑됩니다. 일정한 말속도를 유지하고 군더더기를 줄이며,
            더 완전한 문장을 늘리면 한 단계 높은 밴드에 도달할 수 있어요.
          </Text>
          <Text className="mt-4 text-xs font-bold uppercase text-indigo-600">
            발음 체크
          </Text>
          <View className="mt-2">
            {feedbackTips.map((tip) => (
              <View
                key={tip}
                className="mt-2 rounded-xl bg-white/80 px-3 py-2 first:mt-0"
              >
                <Text className="text-sm font-semibold text-indigo-800">
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <Text className="text-xl font-semibold text-emerald-900">
            샘플 답안 ({level})
          </Text>
          <Text className="mt-3 text-base leading-6 text-emerald-900">
            {sampleAnswer}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
