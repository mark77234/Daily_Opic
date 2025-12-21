import { ActivityIndicator, Text, View } from "react-native";

export function AnalyzingSection() {
  return (
    <View className="mt-10 flex-1 items-center justify-center">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-indigo-50">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
      <Text className="mt-6 text-xl font-semibold text-gray-900">
        Analyzing your response...
      </Text>
      <Text className="mt-2 text-base text-gray-600">
        Checking pronunciation and grammar (약 5초)
      </Text>
    </View>
  );
}
