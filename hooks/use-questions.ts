import { useCallback, useEffect, useMemo, useState } from "react";

import { signInAnonymously } from "firebase/auth";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

import { buildSeedPayloads, seedQuestions } from "@/admin/adminSeedQuestions";
import type { LevelId } from "@/constants/opic";
import { auth, db } from "@/firebase";
import type { QuestionDoc } from "@/types/question";

const mapDocToQuestion = (
  snapshot: Awaited<ReturnType<typeof getDocs>>["docs"][number]
): QuestionDoc => {
  const data = snapshot.data() as {
    questionText: string;
    exampleAnswer: string;
    category: string;
    tags?: string[];
    level: QuestionDoc["level"];
    createdAt?: { toDate?: () => Date };
  };
  const createdAt = data.createdAt?.toDate
    ? data.createdAt.toDate()
    : new Date();

  return {
    id: snapshot.id,
    questionText: data.questionText,
    exampleAnswer: data.exampleAnswer,
    category: data.category,
    tags: data.tags ?? [],
    level: data.level,
    createdAt,
  } as QuestionDoc;
};

const mapSeedToQuestion = (
  payload: ReturnType<typeof buildSeedPayloads>[number]
): QuestionDoc => ({
  id: payload.questionHash,
  questionText: payload.questionText,
  exampleAnswer: payload.exampleAnswer,
  category: payload.category,
  tags: payload.tags,
  level: payload.level,
  createdAt: payload.createdAt.toDate(),
});

export const useQuestions = (levelFilter?: LevelId | null) => {
  const [questions, setQuestions] = useState<QuestionDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Temporary switch: disable Firestore access after seeding; use local questions.json.
  // Flip via EXPO_PUBLIC_FIRESTORE_DISABLED when you want to read/write Firestore again.
  const FIRESTORE_DISABLED =
    process.env.EXPO_PUBLIC_FIRESTORE_DISABLED === "true";
  const shouldAutoSeed = useMemo(
    () => process.env.EXPO_PUBLIC_ENABLE_SEED === "false",
    []
  );

  const scopeToLevel = useCallback(
    (items: QuestionDoc[]) =>
      levelFilter ? items.filter((item) => item.level === levelFilter) : items,
    [levelFilter]
  );

  const ensureSeedAuth = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        console.log(
          "[Questions] No auth user, signing in anonymously for seeding..."
        );
        await signInAnonymously(auth);
      }
    } catch (error) {
      console.error(
        "[Questions] Failed to sign in anonymously for seeding",
        error
      );
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (FIRESTORE_DISABLED) {
        const localSeed = scopeToLevel(
          buildSeedPayloads().map(mapSeedToQuestion)
        );
        setQuestions(localSeed);
        setLoading(false);
        console.log(
          "[Questions] Firestore disabled. Using local questions.json only."
        );
        return;
      }

      console.log(
        `[Questions] Fetching from Firestore${
          levelFilter ? ` for level ${levelFilter}` : ""
        }...`
      );

      const baseQuery = levelFilter
        ? query(
            collection(db, "questions"),
            where("level", "==", levelFilter),
            orderBy("createdAt", "desc")
          )
        : query(collection(db, "questions"), orderBy("createdAt", "desc"));

      let snapshot;

      try {
        snapshot = await getDocs(baseQuery);
      } catch (error) {
        console.error(
          "[Questions] Level-scoped query failed, falling back to unfiltered query",
          error
        );
        const fallbackQuery = query(
          collection(db, "questions"),
          orderBy("createdAt", "desc")
        );
        snapshot = await getDocs(fallbackQuery);
      }

      console.log("[Questions] Firestore snapshot size:", snapshot.size);

      if (snapshot.empty && shouldAutoSeed && !levelFilter) {
        await ensureSeedAuth();
        console.log(
          "[Questions] Firestore empty. Auto seeding from questions.json..."
        );
        const result = await seedQuestions();
        console.log("[Questions] Seed result:", result);
        const seededSnapshot = await getDocs(baseQuery);
        console.log(
          "[Questions] Post-seed snapshot size:",
          seededSnapshot.size
        );

        if (!seededSnapshot.empty) {
          setQuestions(
            scopeToLevel(seededSnapshot.docs.map(mapDocToQuestion))
          );
          setLoading(false);
          return;
        }
      }

      const mapped = scopeToLevel(snapshot.docs.map(mapDocToQuestion));
      if (mapped.length === 0) {
        setError(
          levelFilter
            ? `선택한 목표 레벨(${levelFilter})에 해당하는 문제가 없습니다.`
            : "Firestore에 등록된 문제가 없습니다. Admin Seed 화면에서 업로드 후 다시 시도하세요."
        );
      }
      setQuestions(mapped);
    } catch (err) {
      console.error("Failed to load questions", err);
      // Fallback to local JSON so practice can still run offline/dev.
      const localSeed = scopeToLevel(buildSeedPayloads().map(mapSeedToQuestion));
      setQuestions(localSeed);
      setError(
        "Firestore에서 문항을 불러오지 못했습니다. 로컬 questions.json을 사용합니다. (로그 확인)"
      );
    } finally {
      setLoading(false);
    }
  }, [
    FIRESTORE_DISABLED,
    ensureSeedAuth,
    levelFilter,
    scopeToLevel,
    shouldAutoSeed,
  ]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    error,
    reload: loadQuestions,
  };
};
