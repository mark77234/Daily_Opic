import {
  Timestamp,
  collection,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import type { LevelId } from "@/constants/opic";
import { db } from "@/firebase";
import rawQuestions from "@/questions.json";

type RawQuestion = {
  questionText: string;
  exampleAnswer: string;
  category: string;
  tags: string[];
  level: LevelId;
  createdAt: { timestampValue: string };
};

export type SeedQuestionPayload = Omit<RawQuestion, "createdAt"> & {
  createdAt: Timestamp;
  questionHash: string;
};

// Deterministic hash so the same questionText always maps to the same doc ID.
const createQuestionHash = (questionText: string) => {
  let hash = 0;

  for (let i = 0; i < questionText.length; i += 1) {
    hash = (hash << 5) - hash + questionText.charCodeAt(i);
    hash |= 0; // keep 32-bit int
  }

  return Math.abs(hash).toString(36);
};

export const buildSeedPayloads = (): SeedQuestionPayload[] =>
  (rawQuestions as RawQuestion[]).map((item) => {
    const timestamp =
      typeof item.createdAt?.timestampValue === "string"
        ? Timestamp.fromDate(new Date(item.createdAt.timestampValue))
        : Timestamp.now();

    return {
      questionText: item.questionText.trim(),
      exampleAnswer: item.exampleAnswer.trim(),
      category: item.category,
      tags: item.tags ?? [],
      level: item.level,
      createdAt: timestamp,
      questionHash: createQuestionHash(item.questionText),
    };
  });

export const seedQuestions = async () => {
  // Idempotent upload: hashes prevent duplicates, merge keeps existing docs fresh.
  const payloads = buildSeedPayloads();
  const collectionRef = collection(db, "questions");

  let created = 0;
  let updated = 0;

  for (const payload of payloads) {
    const docRef = doc(collectionRef, payload.questionHash);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      await setDoc(docRef, payload, { merge: true });
      updated += 1;
      continue;
    }

    await setDoc(docRef, payload);
    created += 1;
  }

  return {
    created,
    updated,
    total: payloads.length,
  };
};
