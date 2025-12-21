import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnalyzingSection } from "@/components/practice/analyzing-section";
import { CompletedSection } from "@/components/practice/completed-section";
import { ListeningSection } from "@/components/practice/listening-section";
import {
  FEEDBACK_BY_LEVEL,
  SAMPLE_ANSWER_BY_LEVEL,
} from "@/constants/practice";
import { usePracticeLogic } from "@/hooks/use-practice-logic";

export default function PracticeScreen() {
  const {
    targetLevelLabel,
    targetLevel,
    displayedTranscript,
    evaluationResult,
    filters,
    questionsLoading,
    questionError,
    currentQuestion,
    isListening,
    isAnalyzing,
    isCompleted,
    handleToggleRecognition,
    handleSkipQuestion,
    handleNextQuestion,
  } = usePracticeLogic();

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const stopPulseAnimation = useCallback(() => {
    pulseAnimationRef.current?.stop();
    pulseAnim.setValue(0);
  }, [pulseAnim]);

  const startPulseAnimation = useCallback(() => {
    stopPulseAnimation();

    pulseAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimationRef.current.start();
  }, [pulseAnim, stopPulseAnimation]);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }

    return stopPulseAnimation;
  }, [isListening, startPulseAnimation, stopPulseAnimation]);

  useEffect(() => stopPulseAnimation, [stopPulseAnimation]);

  const handleAdvance = useCallback(
    () =>
      handleNextQuestion().catch((error) =>
        console.error("Failed to move to next question", error)
      ),
    [handleNextQuestion]
  );

  const handleSkip = useCallback(
    () =>
      handleSkipQuestion().catch((error) =>
        console.error("Failed to skip question", error)
      ),
    [handleSkipQuestion]
  );

  const renderContent = () => {
    if (isCompleted) {
      const feedbackMessage = FEEDBACK_BY_LEVEL[evaluationResult.level];
      const levelForSample = targetLevel ?? evaluationResult.level;
      const fallbackSample = SAMPLE_ANSWER_BY_LEVEL[levelForSample];
      const sampleAnswer = {
        en: currentQuestion?.exampleAnswer ?? fallbackSample.en,
        ko: fallbackSample.ko,
      };

      return (
        <CompletedSection
          evaluation={evaluationResult}
          displayedTranscript={displayedTranscript}
          feedbackMessage={feedbackMessage}
          sampleAnswer={sampleAnswer}
          targetLevel={targetLevel}
          category={currentQuestion?.category}
          tags={currentQuestion?.tags ?? []}
          onNextQuestion={handleAdvance}
        />
      );
    }

    if (isAnalyzing) {
      return <AnalyzingSection />;
    }

    if (!questionsLoading && !currentQuestion) {
      return (
        <View className="mt-10 items-center">
          <Text className="text-base font-semibold text-gray-800">
            조건에 맞는 문제가 없습니다.
          </Text>
          <Text className="mt-2 text-sm text-gray-600">
            카테고리/태그/레벨 필터를 조정한 뒤 다시 시도하세요.
          </Text>
        </View>
      );
    }

    return (
      <ListeningSection
        pulseAnim={pulseAnim}
        isListening={isListening}
        onToggle={handleToggleRecognition}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5 pt-4">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-2xl font-semibold text-gray-900">
              Practice Mode
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-base text-gray-600">Targeting:</Text>
              <Text className="text-base font-semibold text-primary-600">
                {targetLevelLabel}
              </Text>
            </View>
            <View className="mt-1 flex-row flex-wrap gap-2">
              {filters.category && (
                <Text className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                  카테고리: {filters.category}
                </Text>
              )}
              {filters.tags.length > 0 && (
                <Text className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  태그: {filters.tags.slice(0, 3).join(", ")}
                  {filters.tags.length > 3 ? " 외" : ""}
                </Text>
              )}
              {filters.level && (
                <Text className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  문제 레벨: {filters.level}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSkip}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 "
          >
            <Text className="text-base font-semibold text-gray-700">
              Skip Question
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/onboarding")}
          className="mt-3 self-start rounded-full border border-primary-200 bg-primary-50 px-3 py-2"
        >
          <Text className="text-base font-semibold text-primary-600">
            목표 등급 다시 선택하기
          </Text>
        </TouchableOpacity>

        <View className="mt-6 rounded-2xl border border-gray-300 bg-white p-5 ">
          {questionsLoading ? (
            <View className="items-center justify-center py-2">
              <ActivityIndicator color="#2563eb" />
              <Text className="mt-2 text-sm text-gray-600">문제를 불러오는 중입니다...</Text>
            </View>
          ) : (
            <>
              <Text className="self-start rounded-full bg-primary-100 px-3 py-1 text-base font-semibold uppercase tracking-wide text-primary-600">
                {currentQuestion?.category ?? "No Category"}
              </Text>
              <Text className="mt-3 text-2xl font-semibold text-gray-900">
                {currentQuestion?.questionText ??
                  "조건에 맞는 문제를 찾지 못했습니다. 필터를 수정하거나 데이터를 업로드하세요."}
              </Text>
              {currentQuestion?.tags?.length ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {currentQuestion.tags.map((tag) => (
                    <Text
                      key={tag}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                    >
                      #{tag}
                    </Text>
                  ))}
                </View>
              ) : null}
              {questionError && (
                <Text className="mt-3 text-sm text-red-600">{questionError}</Text>
              )}
            </>
          )}
        </View>

        {renderContent()}
      </View>
    </SafeAreaView>
  );
}
