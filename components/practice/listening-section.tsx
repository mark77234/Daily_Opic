import { Animated, Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

type ListeningSectionProps = {
  pulseAnim: Animated.Value;
  isListening: boolean;
  onToggle: () => void;
};

export function ListeningSection({
  pulseAnim,
  isListening,
  onToggle,
}: ListeningSectionProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="relative mt-6 h-32 w-32 items-center justify-center">
        {isListening && (
          <>
            <Animated.View
              className="absolute h-32 w-32 rounded-full bg-red-400"
              style={{
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.8],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 0],
                }),
              }}
            />
            <Animated.View
              className="absolute h-28 w-28 rounded-full bg-red-500"
              style={{
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.6],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.25, 0],
                }),
              }}
            />
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onToggle}
          className={`h-20 w-20 items-center justify-center rounded-full shadow-xl ${
            isListening ? "bg-red-500" : "bg-primary-600"
          }`}
        >
          <IconSymbol
            name={isListening ? "stop.fill" : "mic.fill"}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <Text className="mt-3 text-sm font-semibold text-gray-800">
        {isListening ? "Tap to Stop" : "Tap to Answer"}
      </Text>
      <Text className="mt-1 text-xs text-gray-500">
        {isListening ? "Listening..." : "녹음을 시작하려면 탭하세요."}
      </Text>
    </View>
  );
}
