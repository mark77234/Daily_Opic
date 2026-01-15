import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LevelId } from "@/constants/opic";

const PRACTICE_HISTORY_KEY = "opic_practice_history";
const MAX_HISTORY = 50;

export type PracticeHistoryEntry = {
  id: string;
  questionId: string;
  questionText: string;
  category: string;
  tags: string[];
  questionLevel: LevelId;
  targetLevel: LevelId | null;
  evaluationLevel: LevelId;
  transcript: string;
  createdAt: string; // ISO string
};

const parseHistory = (raw: string | null): PracticeHistoryEntry[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PracticeHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const loadPracticeHistory = async () => {
  try {
    const stored = await AsyncStorage.getItem(PRACTICE_HISTORY_KEY);
    return parseHistory(stored);
  } catch (error) {
    console.error("Failed to load practice history", error);
    return [];
  }
};

export const addPracticeHistoryEntry = async (
  entry: PracticeHistoryEntry
) => {
  const existing = await loadPracticeHistory();
  const next = [entry, ...existing].slice(0, MAX_HISTORY);

  try {
    await AsyncStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("Failed to save practice history", error);
  }
};

export const removePracticeHistoryEntry = async (entryId: string) => {
  const existing = await loadPracticeHistory();
  const next = existing.filter((entry) => entry.id !== entryId);

  try {
    await AsyncStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("Failed to remove practice history entry", error);
    return existing;
  }

  return next;
};

export const clearPracticeHistory = async () => {
  try {
    await AsyncStorage.removeItem(PRACTICE_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear practice history", error);
  }
};
