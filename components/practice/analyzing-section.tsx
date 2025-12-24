import { ActivityIndicator, Text, View } from "react-native";

export function AnalyzingSection() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-full max-w-[360px] items-center rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-lg">
        <View className="relative h-24 w-24 items-center justify-center">
          <View className="absolute h-24 w-24 rounded-full border border-indigo-200" />
          <View className="absolute h-20 w-20 rounded-full border border-dashed border-indigo-300 opacity-70" />
          <View className="h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        </View>
        <Text className="mt-5 text-xl font-semibold text-gray-900">
          Analyzing your response...
        </Text>
        <Text className="mt-2 text-sm text-center text-gray-700">
          발음·문법을 확인하고 있어요. 마이크는 그대로 두고 잠시만 기다려 주세요.
        </Text>
      </View>
    </View>
  );
}
