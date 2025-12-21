import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { buildSeedPayloads, seedQuestions } from "@/admin/adminSeedQuestions";
import { auth } from "@/firebase";

const ENABLE_SEED =
  process.env.EXPO_PUBLIC_ENABLE_SEED === "true" || (__DEV__ && true);

export default function AdminSeedScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    created: number;
    updated: number;
    total: number;
  } | null>(null);

  const payloads = useMemo(() => buildSeedPayloads(), []);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserEmail(user?.email ?? null);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("로그인이 필요합니다", "이메일과 비밀번호를 입력하세요.");
      return;
    }

    try {
      setIsLoggingIn(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error("Failed to login", error);
      Alert.alert("로그인 실패", "이메일/비밀번호를 확인하세요.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSeed = async () => {
    if (!auth.currentUser) {
      Alert.alert("로그인 필요", "먼저 관리자 계정으로 로그인하세요.");
      return;
    }

    try {
      setIsSeeding(true);
      const result = await seedQuestions();
      setSeedResult(result);
      Alert.alert(
        "업로드 완료",
        `새로 추가: ${result.created}건, 업데이트: ${result.updated}건`
      );
    } catch (error) {
      console.error("Failed to seed questions", error);
      Alert.alert("업로드 실패", "네트워크 또는 권한을 확인하세요.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setSeedResult(null);
  };

  if (!ENABLE_SEED) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <View className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <Text className="text-lg font-semibold text-red-700">비활성화됨</Text>
          <Text className="mt-2 text-sm text-red-600">
            EXPO_PUBLIC_ENABLE_SEED=false 상태입니다. 초기 세팅 시에만 true로
            변경하세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-6"
        bounces={false}
      >
        <Text className="text-2xl font-bold text-gray-900">
          Admin: Seed Questions
        </Text>
        <Text className="mt-1 text-sm text-gray-600">
          Firestore /questions 컬렉션에 초기 데이터 한 번만 업로드하는 화면입니다.
          일반 사용자 앱 흐름과 분리되어 있습니다.
        </Text>

        <View className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <Text className="text-sm font-semibold text-gray-700">
            관리자 로그인 (Email/Password)
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            inputMode="email"
            placeholder="admin@example.com"
            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-base"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-base"
          />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogin}
            disabled={isLoggingIn}
            className={`rounded-xl px-4 py-3 ${
              isLoggingIn ? "bg-gray-300" : "bg-primary-600"
            }`}
          >
            <Text className="text-center text-base font-semibold text-white">
              {isLoggingIn ? "로그인 중..." : "로그인"}
            </Text>
          </TouchableOpacity>
          {currentUserEmail && (
            <View className="flex-row items-center justify-between rounded-xl bg-white px-3 py-2">
              <Text className="text-sm font-semibold text-gray-800">
                로그인 계정: {currentUserEmail}
              </Text>
              <TouchableOpacity
                onPress={handleSignOut}
                className="rounded-lg bg-gray-100 px-3 py-1"
              >
                <Text className="text-xs font-semibold text-gray-700">
                  로그아웃
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="mt-8 rounded-2xl border border-primary-200 bg-primary-50 p-4">
          <Text className="text-base font-semibold text-primary-800">
            업로드 요약
          </Text>
          <Text className="mt-1 text-sm text-primary-700">
            준비된 문제 수: {payloads.length}건
          </Text>
          <Text className="mt-2 text-xs text-primary-600">
            중복 방지: questionText 해시를 doc ID로 사용하며, 이미 존재하면 최신 데이터로 업데이트합니다.
          </Text>

          <TouchableOpacity
            activeOpacity={0.92}
            onPress={handleSeed}
            disabled={isSeeding}
            className={`mt-4 flex-row items-center justify-center rounded-xl px-4 py-3 ${
              isSeeding ? "bg-primary-200" : "bg-primary-600"
            }`}
          >
            {isSeeding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Firestore로 업로드
              </Text>
            )}
          </TouchableOpacity>

          {seedResult && (
            <View className="mt-4 rounded-xl bg-white px-3 py-2">
              <Text className="text-sm font-semibold text-gray-800">
                결과 요약
              </Text>
              <Text className="mt-1 text-sm text-gray-700">
                새로 추가: {seedResult.created} / 업데이트:{" "}
                {seedResult.updated} / 총 {seedResult.total}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
