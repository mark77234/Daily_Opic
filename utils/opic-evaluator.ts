import { LevelId } from "@/constants/opic";

const fillerWords = [
  "um",
  "uh",
  "erm",
  "hmm",
  "like",
  "you know",
  "i mean",
  "sort of",
  "kind of",
  "well",
];

const subjectCandidates = [
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "it",
  "my",
  "our",
  "their",
  "people",
  "someone",
  "everyone",
];

const verbStems = [
  "am",
  "is",
  "are",
  "was",
  "were",
  "do",
  "did",
  "does",
  "have",
  "has",
  "had",
  "like",
  "love",
  "want",
  "need",
  "go",
  "went",
  "say",
  "said",
  "talk",
  "talked",
  "work",
  "worked",
  "study",
  "studied",
  "live",
  "lived",
  "travel",
  "traveled",
  "enjoy",
  "enjoyed",
  "think",
  "thought",
  "feel",
  "felt",
  "can",
  "could",
  "will",
  "would",
  "should",
];

const connectorWords = [
  "and",
  "but",
  "so",
  "because",
  "since",
  "when",
  "while",
  "if",
  "although",
  "though",
  "before",
  "after",
  "that",
  "which",
  "who",
  "where",
  "however",
  "therefore",
  "meanwhile",
];

const timeMarkers = [
  "yesterday",
  "last",
  "ago",
  "when i was",
  "before",
  "after",
  "tomorrow",
  "next",
  "future",
  "plan",
  "will",
  "would",
  "could",
];

export type OpicEvaluationScores = {
  sentenceCompletionRate: number;
  sentenceComplexity: number;
  fluencyScore: number;
  lexicalVariety: number;
  grammarAccuracy: number;
};

export type OpicEvaluationResult = {
  level: LevelId;
  totalScore: number;
  scores: OpicEvaluationScores;
  notes: string[];
  reasonSummary: string;
  wordCount: number;
  sentenceCount: number;
  fillerRate: number;
  averageSentenceLength: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const repetitionPenalty = (wordTokens: string[]) => {
  if (wordTokens.length === 0) return 0;

  const freq = wordTokens.reduce<Record<string, number>>((acc, word) => {
    acc[word] = (acc[word] ?? 0) + 1;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(freq));
  const ratio = maxCount / wordTokens.length;

  return clamp01((ratio - 0.18) * 2); // penalize when any single word dominates
};

const splitSentences = (text: string) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const raw = normalized
    .split(/[.!?]+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return raw.length > 0 ? raw : [normalized];
};

const countFillerWords = (text: string) => {
  const lowered = text.toLowerCase();
  return fillerWords.reduce((count, filler) => {
    const matches = lowered.match(new RegExp(`\\b${filler}\\b`, "g"));
    return count + (matches?.length ?? 0);
  }, 0);
};

const hasVerb = (word: string) => {
  if (verbStems.includes(word)) return true;
  return /ed$|ing$/.test(word);
};

const hasSubject = (words: string[]) =>
  words.some((word) => subjectCandidates.includes(word));

const mapTotalScoreToLevel = (score: number): LevelId => {
  if (score < 0.24) return "NL";
  if (score < 0.42) return "NM";
  if (score < 0.56) return "NH";
  if (score < 0.66) return "IL";
  if (score < 0.8) return "IM1";
  if (score < 0.85) return "IM2";
  if (score < 0.9) return "IM3";
  if (score < 0.95) return "IH";
  return "AL";
};

const rankLevel: Record<LevelId, number> = {
  NL: 0,
  NM: 1,
  NH: 2,
  IL: 3,
  IM1: 4,
  IM2: 5,
  IM3: 6,
  IH: 7,
  AL: 8,
};

type LevelDecision = {
  level: LevelId | null;
  notes: string[];
  reason?: string;
};

const determineNoviceLevel = (
  args: Pick<
    OpicEvaluationResult,
    | "averageSentenceLength"
    | "sentenceCount"
    | "scores"
    | "wordCount"
    | "fillerRate"
  >
): LevelDecision => {
  const notes: string[] = [];
  const {
    averageSentenceLength,
    sentenceCount,
    scores,
    wordCount,
    fillerRate,
  } = args;

  const noCompleteSentences = scores.sentenceCompletionRate < 0.25;
  const mostlyIsolated = averageSentenceLength <= 3.5 && sentenceCount <= 2;
  const extremelyLimited = wordCount < 15;

  if (noCompleteSentences && mostlyIsolated && extremelyLimited) {
    notes.push(
      "완전한 문장이 거의 없고 발화 길이가 매우 짧습니다.",
      "단어 수가 15개 미만이라 전달이 이어지지 않습니다."
    );
    return {
      level: "NL" as LevelId,
      notes,
      reason: "단어 나열 수준이어서 NL로 판정했습니다.",
    };
  }

  const includesShortSentences =
    averageSentenceLength > 3 && averageSentenceLength <= 6;
  const memorizedFeel = scores.lexicalVariety < 0.35;
  const spontaneousLimited = scores.sentenceCompletionRate < 0.45;
  const hesitationDominant = fillerRate > 0.15;
  const nmSignals = [
    includesShortSentences,
    memorizedFeel,
    spontaneousLimited,
    hesitationDominant,
  ].filter(Boolean).length;

  if (nmSignals >= 3) {
    notes.push(
      "짧은 템플릿 문장이 반복되고 어휘 폭이 좁습니다.",
      "군더더기와 머뭇거림이 많아 발화가 자주 끊깁니다."
    );
    return {
      level: "NM" as LevelId,
      notes,
      reason: "짧은 틀 문장과 잦은 머뭇거림으로 NM으로 평가했습니다.",
    };
  }

  const predictableSentences = scores.sentenceCompletionRate >= 0.5;
  const handlesBasics = wordCount >= 40 && sentenceCount >= 3;
  const beyondMemorized = scores.lexicalVariety >= 0.38;

  if (predictableSentences && handlesBasics && beyondMemorized) {
    notes.push(
      "짧지만 완결된 문장이 감지되었습니다.",
      "기본 기능 전달에 필요한 단어 수와 문장 수가 확보되었습니다."
    );
    return {
      level: "NH" as LevelId,
      notes,
      reason: "짧은 기본 문장을 이어 말할 수 있어 NH로 판정했습니다.",
    };
  }

  return { level: null, notes };
};

const determineAdvancedLevel = (
  args: Pick<
    OpicEvaluationResult,
    "averageSentenceLength" | "sentenceCount" | "scores" | "wordCount"
  > & {
    connectorDensity: number;
    timeMarkerHits: number;
    continuityScore: number;
  }
): LevelDecision => {
  const notes: string[] = [];
  const {
    averageSentenceLength,
    sentenceCount,
    scores,
    wordCount,
    connectorDensity,
    timeMarkerHits,
    continuityScore,
  } = args;

  const coherentMultiSentence =
    sentenceCount >= 5 &&
    averageSentenceLength >= 10 &&
    scores.fluencyScore >= 0.55 &&
    continuityScore >= 0.5;
  const expandedSentences =
    scores.sentenceComplexity >= 0.6 && averageSentenceLength >= 12;
  const solidVocabulary = scores.lexicalVariety >= 0.6;
  if (coherentMultiSentence && expandedSentences && solidVocabulary) {
    notes.push(
      "여러 문장을 연결하며 주제를 확장했습니다.",
      "길이가 긴 문장에서 어휘 다양성과 복합 절 활용이 유지됩니다."
    );
    const connectedDiscourse =
      sentenceCount >= 6 && connectorDensity >= 0.45 && continuityScore >= 0.58;
    const narratesAcrossTime = timeMarkerHits >= 2 && wordCount >= 140;
    const highControl =
      scores.grammarAccuracy >= 0.72 &&
      scores.lexicalVariety >= 0.64 &&
      scores.fluencyScore >= 0.62 &&
      wordCount >= 160;

    if (connectedDiscourse && narratesAcrossTime && highControl) {
      notes.push(
        "시간 전환과 연결어가 자연스럽게 이어지며 분량이 충분합니다.",
        "길고 복합적인 문장에서 문법·어휘 통제가 유지됩니다."
      );
      return {
        level: "AL" as LevelId,
        notes,
        reason: "풍부한 분량과 연결성, 정확도가 높아 AL로 평가했습니다.",
      };
    }

    return {
      level: "IH" as LevelId,
      notes,
      reason: "여러 문장을 연결하며 주제를 확장해 IH로 판정했습니다.",
    };
  }

  return { level: null, notes };
};

const determineIntermediateLevel = (args: {
  scores: OpicEvaluationScores;
  fallback: LevelId;
  averageSentenceLength: number;
  sentenceCount: number;
  wordCount: number;
  connectorDensity: number;
  timeMarkerHits: number;
  fillerRate: number;
  continuityScore: number;
}): LevelDecision => {
  const {
    scores,
    fallback,
    averageSentenceLength,
    sentenceCount,
    wordCount,
    connectorDensity,
    timeMarkerHits,
    fillerRate,
    continuityScore,
  } = args;

  const notes: string[] = [];
  const wordBand = wordCount < 50 ? "low" : wordCount <= 150 ? "mid" : "high";
  const sentenceBand =
    sentenceCount < 3 ? "low" : sentenceCount <= 6 ? "mid" : "high";
  const structureBand =
    scores.sentenceComplexity >= 0.58
      ? "complex"
      : scores.sentenceComplexity >= 0.48
        ? "compound"
        : "simple";
  const hasTimeShift = timeMarkerHits >= 1;

  const meetsIntermediateFloor =
    scores.sentenceCompletionRate >= 0.5 &&
    wordBand !== "low" &&
    sentenceBand !== "low";

  if (!meetsIntermediateFloor) {
    return {
      level: fallback,
      notes: ["중간 밴드를 판정하기에 문장 수나 단어 수가 부족합니다."],
      reason: "분량과 문장 완성도가 낮아 기본 계산 등급을 유지합니다.",
    };
  }

  const simpleDelivery =
    averageSentenceLength < 7 ||
    connectorDensity < 0.22 ||
    scores.lexicalVariety < 0.42 ||
    fillerRate > 0.18;

  if (simpleDelivery) {
    notes.push(
      "짧은 단문 나열이 많아 연결성이 약합니다.",
      "기본 연결어와 시제 표현을 추가하면 곧바로 상향될 수 있습니다."
    );
    return {
      level: "IL" as LevelId,
      notes,
      reason: "연결 부족과 어휘 제한으로 IL에 해당합니다.",
    };
  }

  const im3Candidate =
    wordCount >= 110 &&
    sentenceCount >= 5 &&
    structureBand !== "simple" &&
    connectorDensity >= 0.4 &&
    continuityScore >= 0.55 &&
    scores.lexicalVariety >= 0.52 &&
    scores.grammarAccuracy >= 0.6 &&
    scores.fluencyScore >= 0.6 &&
    hasTimeShift;

  if (im3Candidate) {
    notes.push(
      "연결어와 시간 표현을 활용해 문단을 안정적으로 확장합니다.",
      "어휘 폭과 유창도가 중상 수준 이상입니다."
    );
    return {
      level: "IM3" as LevelId,
      notes,
      reason: "분량과 연결성을 갖춘 담화 전개로 IM3로 분류했습니다.",
    };
  }

  const im2Candidate =
    wordCount >= 80 &&
    sentenceCount >= 4 &&
    connectorDensity >= 0.32 &&
    continuityScore >= 0.48 &&
    scores.lexicalVariety >= 0.48 &&
    scores.sentenceComplexity >= 0.52 &&
    scores.fluencyScore >= 0.55 &&
    hasTimeShift;

  if (im2Candidate) {
    notes.push(
      "기본 연결어와 시제 전환을 활용해 내용을 확장합니다.",
      "완전한 문장 비율과 유창도가 안정적으로 유지됩니다."
    );
    return {
      level: "IM2" as LevelId,
      notes,
      reason: "연결어와 시제 전환이 자연스럽게 녹아 있어 IM2로 평가했습니다.",
    };
  }

  const im1Candidate =
    wordCount >= 60 &&
    sentenceCount >= 3 &&
    connectorDensity >= 0.24 &&
    scores.sentenceComplexity >= 0.44 &&
    scores.fluencyScore >= 0.5 &&
    scores.lexicalVariety >= 0.44;

  if (im1Candidate) {
    notes.push(
      "짧은 문단을 구성하며 주제 소개와 단순 서술이 가능합니다.",
      "완성된 문장 비율이 중간 수준을 충족합니다."
    );
    return {
      level: "IM1" as LevelId,
      notes,
      reason: "주제 소개와 단순 서술이 가능해 IM1으로 분류했습니다.",
    };
  }

  return {
    level: fallback,
    notes: ["중간 밴드 기준과 계산 등급이 일치해 기본 값을 유지합니다."],
    reason: "계산된 점수와 중간 밴드 기준이 유사해 기본 등급을 사용합니다.",
  };
};

export const evaluateTranscript = (
  transcript: string
): OpicEvaluationResult => {
  const normalized = transcript.replace(/\s+/g, " ").trim();
  const sentences = splitSentences(normalized);
  const sentenceCount = sentences.length;
  const wordTokens = normalized.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const wordCount = wordTokens.length;
  const averageSentenceLength =
    sentenceCount === 0 ? wordCount : wordCount / sentenceCount;

  const fillerCount = countFillerWords(normalized);
  const fillerRate = wordCount === 0 ? 0 : fillerCount / wordCount;
  const fluencyScore = clamp01(1 - fillerRate * 3);

  const sentenceWords = sentences.map(
    (sentence) => sentence.toLowerCase().match(/\b[a-z']+\b/g) ?? []
  );

  const completeSentenceCount = sentenceWords.filter((words) => {
    if (words.length < 3) return false;
    return hasSubject(words) && words.some(hasVerb);
  }).length;
  const sentenceCompletionRate =
    sentenceCount === 0 ? 0 : completeSentenceCount / sentenceCount;

  const connectorCount = wordTokens.filter((word) =>
    connectorWords.includes(word)
  ).length;
  const connectorDensity =
    sentenceCount === 0 ? 0 : clamp01(connectorCount / (sentenceCount * 1.5));
  const repetitionScore = repetitionPenalty(wordTokens);
  const timeMarkerHits = timeMarkers.reduce((count, marker) => {
    const matches = normalized.toLowerCase().match(new RegExp(marker, "g"));
    return count + (matches?.length ?? 0);
  }, 0);
  const lengthContribution = clamp01(averageSentenceLength / 18);
  const tenseContribution = clamp01(
    timeMarkerHits / Math.max(1, sentenceCount)
  );
  const sentenceComplexity = clamp01(
    connectorDensity * 0.55 +
      lengthContribution * 0.35 +
      tenseContribution * 0.1
  );

  const uniqueWordCount = new Set(wordTokens).size;
  const lexicalVariety =
    wordCount === 0 ? 0 : clamp01(uniqueWordCount / wordCount);

  const completionPenalty = 1 - sentenceCompletionRate;
  const grammarAccuracy = clamp01(
    1 -
      completionPenalty * 0.6 -
      fillerRate * 0.25 -
      (sentenceComplexity > 0.68 ? 0.05 : 0)
  );

  const continuityScore = clamp01(
    connectorDensity * 0.6 + tenseContribution * 0.4
  );

  const scores: OpicEvaluationScores = {
    sentenceCompletionRate,
    sentenceComplexity,
    fluencyScore,
    lexicalVariety,
    grammarAccuracy,
  };

  const cohesionScore = clamp01(
    sentenceComplexity * 0.55 + continuityScore * 0.45
  );

  const volumeScore = clamp01(
    0.7 * (wordCount / 180) + 0.3 * (sentenceCount / 8)
  );

  const totalScore = clamp01(
    0.16 * scores.fluencyScore +
      0.22 * scores.sentenceCompletionRate +
      0.2 * cohesionScore +
      0.18 * scores.lexicalVariety +
      0.12 * scores.grammarAccuracy +
      0.06 * volumeScore -
      0.06 * repetitionScore -
      (averageSentenceLength > 18 ? 0.03 : 0)
  );

  const totalLevel = mapTotalScoreToLevel(totalScore);

  const noviceCheck = determineNoviceLevel({
    averageSentenceLength,
    sentenceCount,
    scores,
    wordCount,
    fillerRate,
  });

  const advancedCheck = determineAdvancedLevel({
    averageSentenceLength,
    sentenceCount,
    scores,
    wordCount,
    connectorDensity,
    timeMarkerHits,
    continuityScore,
  });

  const intermediateCheck = determineIntermediateLevel({
    scores,
    fallback: totalLevel,
    averageSentenceLength,
    sentenceCount,
    wordCount,
    connectorDensity,
    timeMarkerHits,
    fillerRate,
    continuityScore,
  });

  const baseReason = `가중 특성을 반영한 계산 결과 ${totalLevel} 수준으로 추정했습니다.`;

  let finalDecision: LevelDecision = {
    level: totalLevel,
    notes: [],
    reason: baseReason,
  };

  if (noviceCheck.level) {
    finalDecision = noviceCheck;
  } else if (advancedCheck.level) {
    finalDecision = advancedCheck;
  } else if (intermediateCheck.level) {
    const shouldUseIntermediate =
      rankLevel[intermediateCheck.level] >= rankLevel[totalLevel] ||
      ["IL", "IM1", "IM2", "IM3"].includes(intermediateCheck.level);
    finalDecision = shouldUseIntermediate ? intermediateCheck : finalDecision;
  }

  const metricNotes = [
    `문장 완성도: ${(scores.sentenceCompletionRate * 100).toFixed(0)}% (주어+동사 확인된 문장 비율)`,
    `연결어·시제 활용도: ${(connectorDensity * 100).toFixed(0)}% / 시간 표현 ${timeMarkerHits}회`,
    `평균 문장 길이: ${averageSentenceLength.toFixed(1)}어 (${sentenceCount}문장 / ${wordCount}단어)`,
    `군더더기 비율: ${(fillerRate * 100).toFixed(1)}%`,
    `반복 단어 패널티: ${(repetitionScore * 100).toFixed(0)}%`,
  ];

  let appliedLevel = (finalDecision.level ?? totalLevel) as LevelId;
  if (["NL", "NM", "NH"].includes(appliedLevel)) {
    appliedLevel = "NM";
  }

  const notes: string[] = [...finalDecision.notes, ...metricNotes];
  const reasonSummary =
    finalDecision.reason ??
    (["NL", "NM", "NH"].includes(finalDecision.level ?? "")
      ? "초급 구간은 단일 NM로 묶어 표기합니다."
      : baseReason);

  return {
    level: appliedLevel,
    totalScore,
    scores,
    notes,
    reasonSummary,
    wordCount,
    sentenceCount,
    fillerRate,
    averageSentenceLength,
  };
};
