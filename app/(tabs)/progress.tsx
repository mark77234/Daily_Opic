import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgressScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        bounces={false}
        contentContainerClassName="flex-grow px-6 pb-10 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="text-2xl font-semibold text-gray-900">Your Progress</Text>
          <View className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <Text className="text-center text-sm text-gray-400">No practice data yet.</Text>
          </View>
        </View>

        <View className="mt-10">
          <Text className="text-xl font-semibold text-gray-900">Recent Attempts</Text>
          <View className="mt-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-5">
            <Text className="text-center text-sm font-semibold text-gray-500">
              No practice sessions yet.
            </Text>
            <Text className="mt-1 text-center text-xs text-primary-600">
              Go to Practice to start practicing!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
