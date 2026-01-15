import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

export function AnalyzingSection() {
  const ringA = useRef(new Animated.Value(0)).current;
  const ringB = useRef(new Animated.Value(0)).current;
  const ringC = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const animations = [
      createPulse(ringA, 0),
      createPulse(ringB, 280),
      createPulse(ringC, 560),
    ];

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [ringA, ringB, ringC]);

  const ringStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 0],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.75, 1.45],
        }),
      },
    ],
  });

  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="items-center">
        <Text className="text-3xl font-extrabold tracking-widest text-gray-900">
          OPIC
        </Text>
        <Text className="mt-1 text-xs font-semibold tracking-[2px] text-gray-500">
          SPEAKING CHECK
        </Text>
      </View>

      <View className="relative mt-8 h-44 w-44 items-center justify-center">
        <Animated.View
          className="absolute h-40 w-40 rounded-full border border-blue-200"
          style={ringStyle(ringA)}
        />
        <Animated.View
          className="absolute h-32 w-32 rounded-full border border-blue-300"
          style={ringStyle(ringB)}
        />
        <Animated.View
          className="absolute h-24 w-24 rounded-full border border-blue-400"
          style={ringStyle(ringC)}
        />
      </View>

      <Text className="mt-6 text-base font-semibold text-gray-900">
        답변을 분석하고 있어요
      </Text>
      <Text className="mt-2 text-center text-xs leading-5 text-gray-500">
        발음과 문장 흐름을 확인 중입니다. 마이크는 그대로 두고 잠시만 기다려
        주세요.
      </Text>
    </View>
  );
}
