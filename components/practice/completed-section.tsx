import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { LevelId } from "@/constants/opic";
import type { OpicEvaluationResult } from "@/utils/opic-evaluator";

type CompletedSectionProps = {
  evaluation: OpicEvaluationResult;
  displayedTranscript: string;
  feedbackMessage: string;
  sampleAnswer: string;
  targetLevel?: LevelId | null;
  category?: string | null;
  tags?: string[];
  onNextQuestion: () => void | Promise<void>;
};

export function CompletedSection({
  evaluation,
  displayedTranscript,
  feedbackMessage,
  sampleAnswer,
  targetLevel,
  category,
  tags,
  onNextQuestion,
}: CompletedSectionProps) {
  const { level, wordCount, sentenceCount } = evaluation;

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
                OPIc 평가 등급
              </Text>
              <Text className="mt-1 text-4xl font-extrabold text-amber-300">
                {level}
              </Text>
              {/* <Text className="mt-2 text-xs font-semibold text-amber-100">
                한줄 평가
              </Text>
              <Text className="mt-1 text-sm leading-5 text-amber-50">
                {reasonSummary}
              </Text> */}
              {category && (
                <Text className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-100">
                  Category: {category}
                </Text>
              )}
              {tags && tags.length > 0 && (
                <View className="mt-1 flex-row flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Text
                      key={tag}
                      className="rounded-full bg-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-900"
                    >
                      #{tag}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View className="mt-4 w-full">
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={onNextQuestion}
              className="rounded-xl border border-amber-200 bg-amber-400 px-4 py-3 shadow-md shadow-amber-500/30 w-full items-center justify-center"
            >
              <Text className="text-base font-extrabold text-amber-950">
                다음 질문으로 넘어가기
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <Text className="text-lg font-semibold text-amber-900">
            발화 요약
          </Text>
          <Text className="mt-2 text-sm text-amber-800">
            이번 답변에서 감지한 기본 길이 정보예요.
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
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
              피드백
            </Text>
          </View>
          <View className="mt-3 rounded-xl bg-white/90 px-3 py-3">
            <Text className="text-sm font-semibold text-indigo-700">
              {level} 등급 피드백
            </Text>
            <Text className="mt-2 text-base leading-6 text-indigo-900">
              {feedbackMessage}
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <Text className="text-xl font-semibold text-emerald-900">
            샘플 답안 ({targetLevel ?? level})
          </Text>
          <Text className="mt-1 text-xs font-semibold text-emerald-700">
            Firestore exampleAnswer 기반
          </Text>
          <Text className="mt-3 text-base leading-6 text-emerald-900">
            {sampleAnswer}
          </Text>
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <Text className="text-sm font-extrabold uppercase tracking-wide text-gray-700">
            참고
          </Text>
          <Text className="mt-2 text-sm leading-5 text-gray-800">
            표시된 등급은 재미 요소일 뿐이며 실제 OPIc 등급과 다를 수 있어요.
          </Text>
          <Text className="mt-2 text-sm leading-5 text-gray-800">
            현재 산정 기준: 단어 수와 평균 문장 길이 중심 + 반복 단어, 군더더기,
            너무 짧은 문장은 감점됩니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
