import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import type { LevelId } from "@/constants/opic";
import type { QuestionFilters } from "@/types/question";

const FILTER_STORAGE_KEY = "opic_question_filters";

const DEFAULT_FILTERS: QuestionFilters = {
  category: null,
  tags: [],
  level: null,
};

const parseStoredFilters = (raw: string | null): QuestionFilters => {
  if (!raw) return DEFAULT_FILTERS;

  try {
    const parsed = JSON.parse(raw) as QuestionFilters;

    return {
      category: parsed.category ?? null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      level: parsed.level ?? null,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
};

export const useQuestionFilters = () => {
  const [filters, setFilters] = useState<QuestionFilters>(DEFAULT_FILTERS);
  const [loadingFilters, setLoadingFilters] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const stored = await AsyncStorage.getItem(FILTER_STORAGE_KEY);
        setFilters(parseStoredFilters(stored));
      } catch (error) {
        console.error("Failed to load question filters", error);
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFilters();
  }, []);

  const persistFilters = useCallback(async (next: QuestionFilters) => {
    setFilters(next);

    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save question filters", error);
    }
  }, []);

  const updateCategory = useCallback(
    (category: string | null) =>
      persistFilters({
        ...filters,
        category,
      }),
    [filters, persistFilters]
  );

  const updateLevel = useCallback(
    (level: LevelId | null) =>
      persistFilters({
        ...filters,
        level,
      }),
    [filters, persistFilters]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const hasTag = filters.tags.includes(tag);
      const nextTags = hasTag
        ? filters.tags.filter((item) => item !== tag)
        : [...filters.tags, tag];

      persistFilters({
        ...filters,
        tags: nextTags,
      });
    },
    [filters, persistFilters]
  );

  const clearFilters = useCallback(
    () => persistFilters(DEFAULT_FILTERS),
    [persistFilters]
  );

  return {
    filters,
    loadingFilters,
    updateCategory,
    updateLevel,
    toggleTag,
    clearFilters,
    setFilters: persistFilters,
  };
};
