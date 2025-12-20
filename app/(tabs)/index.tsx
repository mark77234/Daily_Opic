import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnalyzingSection } from "@/components/practice/analyzing-section";
import { CompletedSection } from "@/components/practice/completed-section";
import { ListeningSection } from "@/components/practice/listening-section";
import { FEEDBACK_TIPS, QUESTION, SAMPLE_ANSWER } from "@/constants/practice";
import { usePracticeLogic } from "@/hooks/use-practice-logic";

export default function PracticeScreen() {
  const {
    targetLevelLabel,
    estimatedGrade,
    displayedTranscript,
    isListening,
    isAnalyzing,
    isCompleted,
    handleToggleRecognition,
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

  const renderContent = () => {
    if (isCompleted) {
      return (
        <CompletedSection
          estimatedGrade={estimatedGrade}
          displayedTranscript={displayedTranscript}
          feedbackTips={FEEDBACK_TIPS}
          sampleAnswer={SAMPLE_ANSWER}
          onNextQuestion={handleNextQuestion}
        />
      );
    }

    if (isAnalyzing) {
      return <AnalyzingSection />;
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
      <View className="flex-1 px-5 pb-10 pt-4">
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
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {}}
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
          <Text className="self-start rounded-full bg-primary-100 px-3 py-1 text-base font-semibold uppercase tracking-wide text-primary-600">
            {QUESTION.category}
          </Text>
          <Text className="mt-3 text-2xl font-semibold text-gray-900">
            {QUESTION.prompt}
          </Text>
        </View>

        {renderContent()}
      </View>
    </SafeAreaView>
  );
}
