import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  LEVEL_OPTIONS,
  LevelId,
  TARGET_LEVEL_STORAGE_KEY,
} from "@/constants/opic";
import { ANALYSIS_DURATION_MS, DEFAULT_TRANSCRIPT } from "@/constants/practice";
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export type Phase = "idle" | "listening" | "analyzing" | "completed";

export const usePracticeLogic = () => {
  const [targetLevel, setTargetLevel] = useState<LevelId | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTargetLevel = useCallback(async () => {
    const storedLevel = await AsyncStorage.getItem(TARGET_LEVEL_STORAGE_KEY);
    const isValidLevel = LEVEL_OPTIONS.some(
      (option) => option.id === storedLevel
    );

    return isValidLevel ? (storedLevel as LevelId) : null;
  }, []);

  const clearAnalysisTimer = useCallback(() => {
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearAnalysisTimer, [clearAnalysisTimer]);

  const startAnalysisCountdown = useCallback(() => {
    clearAnalysisTimer();
    setPhase("analyzing");

    analysisTimerRef.current = setTimeout(() => {
      setPhase("completed");
      analysisTimerRef.current = null;
    }, ANALYSIS_DURATION_MS);
  }, [clearAnalysisTimer]);

  const ensureSpeechPermission = useCallback(async () => {
    try {
      const permission =
        await ExpoSpeechRecognitionModule.getPermissionsAsync();

      if (permission.granted) {
        setPermissionGranted(true);
        setErrorMessage(null);
        return true;
      }

      const requested =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setPermissionGranted(requested.granted);

      if (!requested.granted) {
        setErrorMessage("음성 인식과 마이크 접근을 허용해야 합니다.");
        return false;
      }

      setErrorMessage(null);
      return true;
    } catch (error) {
      console.error("Failed to request speech permissions", error);
      setErrorMessage("권한을 확인하는 중 문제가 발생했습니다.");
      return false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const hydrateLevel = async () => {
        try {
          const storedLevel = await loadTargetLevel();

          if (isMounted) {
            setTargetLevel(storedLevel);
          }
        } catch (error) {
          console.error("Failed to load target level", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      hydrateLevel();

      return () => {
        isMounted = false;
      };
    }, [loadTargetLevel])
  );

  useEffect(() => {
    ensureSpeechPermission();
  }, [ensureSpeechPermission]);

  const handleSpeechStart = useCallback(() => {
    setPhase("listening");
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setPhase((prev) => (prev === "listening" ? "idle" : prev));
  }, []);

  const handleSpeechResult = useCallback(
    (event: ExpoSpeechRecognitionResultEvent) => {
      const bestResult = event.results.reduce<
        ExpoSpeechRecognitionResultEvent["results"][number] | null
      >((best, current) => {
        if (!best) {
          return current;
        }

        // Prefer available confidence scores; fall back to the last result.
        const bestConfidence = best.confidence ?? -1;
        const currentConfidence = current.confidence ?? -1;

        if (bestConfidence === -1 && currentConfidence !== -1) {
          return current;
        }

        if (currentConfidence === -1) {
          return best;
        }

        return currentConfidence > bestConfidence ? current : best;
      }, null);

      const normalizedTranscript = bestResult?.transcript.trim() ?? "";

      if (!normalizedTranscript) {
        return;
      }

      setTranscript((prev) => {
        if (event.isFinal) {
          return normalizedTranscript;
        }

        // Only surface interim results when nothing exists yet; avoid overwriting a more confident final string.
        return prev || normalizedTranscript;
      });
    },
    []
  );

  const handleSpeechError = useCallback(
    (event: ExpoSpeechRecognitionErrorEvent) => {
      setPhase("idle");
      setErrorMessage(event.message);
    },
    []
  );

  useSpeechRecognitionEvent("start", handleSpeechStart);
  useSpeechRecognitionEvent("end", handleSpeechEnd);
  useSpeechRecognitionEvent("result", handleSpeechResult);
  useSpeechRecognitionEvent("error", handleSpeechError);

  const handleToggleRecognition = useCallback(async () => {
    if (phase === "analyzing") {
      return;
    }

    if (phase === "listening") {
      ExpoSpeechRecognitionModule.stop();
      startAnalysisCountdown();
      return;
    }

    setErrorMessage(null);
    setTranscript("");

    const hasPermission = await ensureSpeechPermission();

    if (!hasPermission) {
      setPhase("idle");
      return;
    }

    try {
      setPhase("listening");

      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.error("Failed to start speech recognition", error);
      setPhase("idle");
      setErrorMessage("음성 인식을 시작할 수 없습니다.");
    }
  }, [ensureSpeechPermission, phase, startAnalysisCountdown]);

  const handleNextQuestion = useCallback(() => {
    clearAnalysisTimer();
    setPhase("idle");
    setTranscript("");
    setErrorMessage(null);
  }, [clearAnalysisTimer]);

  const targetLevelLabel = loading
    ? "불러오는 중..."
    : (targetLevel ?? "미설정");

  const estimatedGrade = (targetLevel ?? "IM2") as LevelId;
  const displayedTranscript = transcript || DEFAULT_TRANSCRIPT;
  const isListening = phase === "listening";
  const isAnalyzing = phase === "analyzing";
  const isCompleted = phase === "completed";

  return {
    targetLevelLabel,
    estimatedGrade,
    displayedTranscript,
    transcript,
    permissionGranted,
    errorMessage,
    isListening,
    isAnalyzing,
    isCompleted,
    handleToggleRecognition,
    handleNextQuestion,
  };
};
