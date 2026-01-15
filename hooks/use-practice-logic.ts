import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import {
  evaluateTranscript,
  type OpicEvaluationResult,
} from "@/utils/opic-evaluator";
import { useQuestionFilters } from "@/hooks/use-question-filters";
import { useQuestions } from "@/hooks/use-questions";
import type { QuestionDoc } from "@/types/question";
import { addPracticeHistoryEntry } from "@/utils/practice-history";

export type Phase = "idle" | "listening" | "analyzing" | "completed";

export const usePracticeLogic = () => {
  const [targetLevel, setTargetLevel] = useState<LevelId | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const manualStopRef = useRef(false);
  const attemptIdRef = useRef(0);
  const savedAttemptIdRef = useRef<number | null>(null);

  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { filters, loadingFilters } = useQuestionFilters();
  const {
    questions,
    loading: loadingQuestions,
    error: questionError,
    reload,
  } = useQuestions(targetLevel);

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

  const filteredQuestions: QuestionDoc[] = useMemo(() => {
    const desiredLevel = filters.level ?? targetLevel;

    const scoped = questions.filter((question) => {
      const matchesCategory = filters.category
        ? question.category === filters.category
        : true;

      const matchesTags = filters.tags.length
        ? filters.tags.some((tag) => question.tags?.includes(tag))
        : true;

      const matchesLevel = desiredLevel
        ? question.level === desiredLevel
        : true;

      return matchesCategory && matchesTags && matchesLevel;
    });

    return scoped.length > 0 ? scoped : questions;
  }, [filters, questions, targetLevel]);

  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [filteredQuestions.length]);

  const currentQuestion: QuestionDoc | null =
    filteredQuestions.length > 0
      ? filteredQuestions[currentQuestionIndex % filteredQuestions.length]
      : null;

  const handleSpeechStart = useCallback(() => {
    manualStopRef.current = false;
    attemptIdRef.current += 1;
    savedAttemptIdRef.current = null;
    setPhase("listening");
    setErrorMessage(null);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setPhase((prev) => {
      if (prev !== "listening") {
        return prev;
      }

      if (manualStopRef.current) {
        manualStopRef.current = false;
        return prev;
      }

      const trimmed = transcript.trim();
      const interruptionReason = trimmed.length
        ? "말씀이 잠시 끊겨 인식이 중단됐어요."
        : "음성이 감지되지 않아 인식이 자동으로 멈췄어요.";

      setErrorMessage(
        `${interruptionReason} 마이크를 휴대폰 가까이에 대고 끊기지 않게 이어서 말해 주세요.`
      );

      return "idle";
    });
  }, [transcript]);

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
      setErrorMessage(
        `${event.message}. 마이크를 휴대폰 가까이에 두고 다시 이어서 말해 주세요.`
      );
    },
    []
  );

  useSpeechRecognitionEvent("start", handleSpeechStart);
  useSpeechRecognitionEvent("end", handleSpeechEnd);
  useSpeechRecognitionEvent("result", handleSpeechResult);
  useSpeechRecognitionEvent("error", handleSpeechError);

  const evaluationInput = transcript || DEFAULT_TRANSCRIPT;
  const evaluationResult: OpicEvaluationResult = useMemo(
    () => evaluateTranscript(evaluationInput),
    [evaluationInput]
  );

  const handleToggleRecognition = useCallback(async () => {
    if (phase === "analyzing") {
      return;
    }

    if (!currentQuestion) {
      setErrorMessage("문제를 불러온 뒤에 연습을 시작하세요.");
      return;
    }

    if (phase === "listening") {
      manualStopRef.current = true;
      ExpoSpeechRecognitionModule.stop();
      startAnalysisCountdown();
      return;
    }

    setErrorMessage(null);
    setTranscript("");
    manualStopRef.current = false;

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
  }, [
    currentQuestion,
    ensureSpeechPermission,
    phase,
    startAnalysisCountdown,
  ]);

  const recordHistory = useCallback(async () => {
    if (!currentQuestion) return;
    const attemptId = attemptIdRef.current;

    if (savedAttemptIdRef.current === attemptId) {
      return;
    }

    const entry = {
      id: `${Date.now()}`,
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText,
      category: currentQuestion.category,
      tags: currentQuestion.tags ?? [],
      questionLevel: currentQuestion.level,
      targetLevel,
      evaluationLevel: evaluationResult.level,
      transcript: evaluationInput,
      createdAt: new Date().toISOString(),
    };

    await addPracticeHistoryEntry(entry);
    savedAttemptIdRef.current = attemptId;
  }, [
    currentQuestion,
    evaluationInput,
    evaluationResult.level,
    targetLevel,
  ]);

  useEffect(() => {
    if (phase !== "completed") {
      return;
    }

    if (!currentQuestion) {
      return;
    }

    if (savedAttemptIdRef.current === attemptIdRef.current) {
      return;
    }

    recordHistory().catch((error) =>
      console.error("Failed to auto-save practice history", error)
    );
  }, [currentQuestion, phase, recordHistory]);

  const handleNextQuestion = useCallback(
    async (options?: { skipSave?: boolean }) => {
      if (!options?.skipSave) {
        await recordHistory();
      }

      clearAnalysisTimer();
      setPhase("idle");
      setTranscript("");
      setErrorMessage(null);
      setCurrentQuestionIndex((prev) =>
        filteredQuestions.length > 0
          ? (prev + 1) % filteredQuestions.length
          : prev
      );
    },
    [clearAnalysisTimer, filteredQuestions.length, recordHistory]
  );

  const handleSkipQuestion = useCallback(
    () => handleNextQuestion({ skipSave: true }),
    [handleNextQuestion]
  );

  const targetLevelLabel = loading
    ? "불러오는 중..."
    : (targetLevel ?? "미설정");

  const estimatedGrade = evaluationResult.level;
  const displayedTranscript = evaluationInput;
  const isListening = phase === "listening";
  const isAnalyzing = phase === "analyzing";
  const isCompleted = phase === "completed";
  const questionsLoading = loadingFilters || loadingQuestions;

  return {
    targetLevelLabel,
    targetLevel,
    filters,
    questionsLoading,
    questionError,
    filteredQuestions,
    currentQuestion,
    estimatedGrade,
    displayedTranscript,
    evaluationResult,
    transcript,
    permissionGranted,
    errorMessage,
    isListening,
    isAnalyzing,
    isCompleted,
    handleSkipQuestion,
    handleToggleRecognition,
    handleNextQuestion,
    reloadQuestions: reload,
  };
};
