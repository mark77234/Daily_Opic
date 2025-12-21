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
  wordCount: number;
  sentenceCount: number;
  fillerRate: number;
  averageSentenceLength: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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
  if (score < 0.2) return "NL";
  if (score < 0.4) return "NM";
  if (score < 0.6) return "NH";
  if (score < 0.7) return "IL";
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

const determineNoviceLevel = (
  args: Pick<
    OpicEvaluationResult,
    "averageSentenceLength" | "sentenceCount" | "scores" | "wordCount" | "fillerRate"
  >
) => {
  const notes: string[] = [];
  const { averageSentenceLength, sentenceCount, scores, wordCount, fillerRate } = args;

  const noCompleteSentences = scores.sentenceCompletionRate === 0;
  const mostlyIsolated = averageSentenceLength <= 3 && sentenceCount <= 2;
  const extremelyLimited = wordCount < 15;

  if (noCompleteSentences && mostlyIsolated && extremelyLimited) {
    notes.push(
      "Isolated words/phrases detected with no complete S+V units.",
      "Total word count under 15 limits functional communication."
    );
    return { level: "NL" as LevelId, notes };
  }

  const includesShortSentences = averageSentenceLength > 3 && averageSentenceLength <= 6;
  const memorizedFeel = scores.lexicalVariety < 0.35;
  const spontaneousLimited = scores.sentenceCompletionRate < 0.45;
  const hesitationDominant = fillerRate > 0.12;
  const nmSignals = [
    includesShortSentences,
    memorizedFeel,
    spontaneousLimited,
    hesitationDominant,
  ].filter(Boolean).length;

  if (nmSignals >= 3) {
    notes.push(
      "Mostly short or templated sentences; lexical variety is narrow.",
      "Hesitations/repetitions outweigh spontaneous content."
    );
    return { level: "NM" as LevelId, notes };
  }

  const predictableSentences = scores.sentenceCompletionRate >= 0.45;
  const handlesBasics = wordCount >= 30 && sentenceCount >= 2;
  const beyondMemorized = scores.lexicalVariety >= 0.38;

  if (predictableSentences && handlesBasics && beyondMemorized) {
    notes.push(
      "Predictable short sentences present with basic functional coverage.",
      "Some variety beyond pure memorization was detected."
    );
    return { level: "NH" as LevelId, notes };
  }

  return { level: null, notes };
};

const determineAdvancedLevel = (
  args: Pick<
    OpicEvaluationResult,
    | "averageSentenceLength"
    | "sentenceCount"
    | "scores"
    | "wordCount"
  > & { connectorDensity: number; timeMarkerHits: number }
) => {
  const notes: string[] = [];
  const {
    averageSentenceLength,
    sentenceCount,
    scores,
    wordCount,
    connectorDensity,
    timeMarkerHits,
  } = args;

  const coherentMultiSentence =
    sentenceCount >= 4 && averageSentenceLength >= 8 && scores.fluencyScore >= 0.55;
  const expandedSentences = scores.sentenceComplexity >= 0.55 && averageSentenceLength >= 10;
  const solidVocabulary = scores.lexicalVariety >= 0.6;
  if (coherentMultiSentence && expandedSentences && solidVocabulary) {
    notes.push(
      "Multi-sentence explanations remain coherent.",
      "Sentence expansion and vocabulary range support familiar topics."
    );
    const connectedDiscourse =
      sentenceCount >= 5 && connectorDensity >= 0.6 && averageSentenceLength >= 12;
    const narratesAcrossTime = timeMarkerHits >= 2 && wordCount >= 120;
    const highControl = scores.grammarAccuracy >= 0.7 && scores.lexicalVariety >= 0.65;

    if (connectedDiscourse && narratesAcrossTime && highControl) {
      notes.push(
        "Connected discourse with transition devices and time-framed narration detected.",
        "Grammar and lexical control remain high despite longer turns."
      );
      return { level: "AL" as LevelId, notes };
    }

    return { level: "IH" as LevelId, notes };
  }

  return { level: null, notes };
};

const determineIntermediateLevel = (
  scores: OpicEvaluationScores,
  fallback: LevelId
) => {
  const band = (value: number, medium: number, high: number) => {
    if (value >= high) return 2;
    if (value >= medium) return 1;
    return 0;
  };

  const complexityBand = band(scores.sentenceComplexity, 0.45, 0.7);
  const fluencyBand = band(scores.fluencyScore, 0.5, 0.72);
  const lexicalBand = band(scores.lexicalVariety, 0.45, 0.62);

  const meetsIntermediateFloor =
    scores.sentenceCompletionRate >= 0.45 &&
    scores.fluencyScore >= 0.35 &&
    scores.lexicalVariety >= 0.32;

  if (!meetsIntermediateFloor) {
    return {
      level: fallback,
      notes: ["Insufficient base control for IM band; using fallback level."],
    };
  }

  if (complexityBand === 2 && fluencyBand === 2 && lexicalBand === 2) {
    return { level: "IM3" as LevelId, notes: ["High complexity/fluency/lexical variety detected."] };
  }

  if (complexityBand >= 1 && fluencyBand >= 1 && lexicalBand >= 1) {
    return { level: "IM2" as LevelId, notes: ["Consistent medium-range complexity, fluency, and variety."] };
  }

  if (complexityBand >= 0 && fluencyBand >= 0 && lexicalBand >= 0) {
    return {
      level: "IM1" as LevelId,
      notes: ["Baseline intermediate control present across all three metrics."],
    };
  }

  return {
    level: fallback,
    notes: ["Falling back to lower band based on weakest matching criteria."],
  };
};

export const evaluateTranscript = (transcript: string): OpicEvaluationResult => {
  const normalized = transcript.replace(/\s+/g, " ").trim();
  const sentences = splitSentences(normalized);
  const sentenceCount = sentences.length;
  const wordTokens =
    normalized.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const wordCount = wordTokens.length;
  const averageSentenceLength = sentenceCount === 0 ? wordCount : wordCount / sentenceCount;

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

  const connectorCount = wordTokens.filter((word) => connectorWords.includes(word)).length;
  const connectorDensity =
    sentenceCount === 0 ? 0 : clamp01(connectorCount / (sentenceCount * 1.5));
  const lengthContribution = clamp01(averageSentenceLength / 14);
  const sentenceComplexity = clamp01(
    connectorDensity * 0.6 + lengthContribution * 0.4
  );

  const uniqueWordCount = new Set(wordTokens).size;
  const lexicalVariety =
    wordCount === 0 ? 0 : clamp01(uniqueWordCount / wordCount);

  const completionPenalty = 1 - sentenceCompletionRate;
  const grammarAccuracy = clamp01(
    1 - completionPenalty * 0.55 - fillerRate * 0.2 - (averageSentenceLength > 22 ? 0.08 : 0)
  );

  const scores: OpicEvaluationScores = {
    sentenceCompletionRate,
    sentenceComplexity,
    fluencyScore,
    lexicalVariety,
    grammarAccuracy,
  };

  const weights = {
    fluency: 0.3,
    complexity: 0.25,
    lexical: 0.2,
    grammar: 0.25,
  };

  const totalScore = clamp01(
    weights.fluency * scores.fluencyScore +
      weights.complexity * scores.sentenceComplexity +
      weights.lexical * scores.lexicalVariety +
      weights.grammar * scores.grammarAccuracy
  );

  const totalLevel = mapTotalScoreToLevel(totalScore);

  const noviceCheck = determineNoviceLevel({
    averageSentenceLength,
    sentenceCount,
    scores,
    wordCount,
    fillerRate,
  });

  const timeMarkerHits = timeMarkers.reduce((count, marker) => {
    const matches = normalized.toLowerCase().match(new RegExp(marker, "g"));
    return count + (matches?.length ?? 0);
  }, 0);

  const advancedCheck = determineAdvancedLevel({
    averageSentenceLength,
    sentenceCount,
    scores,
    wordCount,
    connectorDensity,
    timeMarkerHits,
  });

  const intermediateCheck = determineIntermediateLevel(scores, totalLevel);

  const priorityLevel =
    noviceCheck.level ??
    advancedCheck.level ??
    (["IM1", "IM2", "IM3"].includes(intermediateCheck.level ?? "")
      ? intermediateCheck.level
      : null);

  const finalLevel: LevelId =
    priorityLevel ??
    (rankLevel[intermediateCheck.level ?? totalLevel] >
    rankLevel[totalLevel]
      ? (intermediateCheck.level as LevelId)
      : totalLevel);

  const notes: string[] = [
    `Weighted score mapped to ${totalLevel} (${(totalScore * 100).toFixed(0)}/100).`,
  ];

  if (noviceCheck.level) {
    notes.unshift(`Rule-based match: ${noviceCheck.level} due to novice speech patterns.`);
    notes.push(...noviceCheck.notes);
  } else if (advancedCheck.level) {
    notes.unshift(`Rule-based match: ${advancedCheck.level} from advanced discourse signals.`);
    notes.push(...advancedCheck.notes);
  } else if (["IM1", "IM2", "IM3"].includes(intermediateCheck.level ?? "")) {
    notes.unshift(`Intermediate band resolved to ${intermediateCheck.level}.`);
    notes.push(...intermediateCheck.notes);
  } else if (intermediateCheck.notes.length) {
    notes.push(...intermediateCheck.notes);
  }

  notes.push(
    `Sentence completion rate: ${(scores.sentenceCompletionRate * 100).toFixed(0)}%.`,
    `Connector density: ${(connectorDensity * 100).toFixed(0)}% with avg sentence length ${averageSentenceLength.toFixed(
      1
    )} words.`,
    `Filler rate: ${(fillerRate * 100).toFixed(1)}%`
  );

  return {
    level: finalLevel,
    totalScore,
    scores,
    notes,
    wordCount,
    sentenceCount,
    fillerRate,
    averageSentenceLength,
  };
};
