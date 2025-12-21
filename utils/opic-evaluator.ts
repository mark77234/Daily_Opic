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

export type OpicEvaluationScores = {
  wordScore: number;
  lengthScore: number;
  penalty: number;
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

// 총점 기준: 위에서부터 "점수 >= min"을 만족하면 바로 해당 등급으로 판정됩니다.
// 원하는 난이도로 숫자나 순서를 마음껏 조정하세요.
const LEVEL_THRESHOLDS: { min: number; level: LevelId }[] = [
  { level: "AL", min: 0.7 },
  { level: "IH", min: 0.65 },
  { level: "IM3", min: 0.65 },
  { level: "IM2", min: 0.6 },
  { level: "IM1", min: 0.5 },
  { level: "IL", min: 0.4 },
  { level: "NH", min: 0.3 },
  { level: "NM", min: 0.2 },
  { level: "NL", min: 0.1 },
];

const mapTotalScoreToLevel = (score: number): LevelId => {
  const hit = LEVEL_THRESHOLDS.find((entry) => score >= entry.min);
  return hit ? (hit.level as LevelId) : "NL";
};

// 등급 체감 강도를 바꾸려면 아래 숫자만 수정하세요.
// - wordTarget/lengthTarget: 단어 수와 평균 문장 길이가 이 값에 가까울수록 만점
// - weights: 단어 수/문장 길이에 줄 비중
// - penalties: 반복, 군더더기, 짧은 문장 감점 비율
// - scoreNudge: 최종 총점을 올리거나 내릴 때 사용
const SCORING_CONFIG = {
  wordTarget: 220, // 단어 수 타깃 (예: IH 예시 1분 30초 발화량 근사)
  lengthTarget: 16, // 평균 문장 길이 타깃 (단어 기준)
  minLengthFloor: 6, // 이 값보다 문장이 짧으면 감점이 시작됩니다.
  weights: {
    word: 0.55,
    length: 0.45,
  },
  penalties: {
    repetition: 0.08,
    filler: 0.07,
    shortSentence: 0.07,
  },
  scoreNudge: 0, // +0.03이면 등급이 한 단계 관대해지고, -0.03이면 엄격해집니다.
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

  const wordScore = clamp01(wordCount / SCORING_CONFIG.wordTarget);
  const lengthScore = clamp01(
    averageSentenceLength / SCORING_CONFIG.lengthTarget
  );

  const shortPenalty =
    averageSentenceLength < SCORING_CONFIG.minLengthFloor
      ? clamp01(
          (SCORING_CONFIG.minLengthFloor - averageSentenceLength) /
            SCORING_CONFIG.minLengthFloor
        )
      : 0;

  const repetitionScore = repetitionPenalty(wordTokens);

  const penalty =
    SCORING_CONFIG.penalties.repetition * repetitionScore +
    SCORING_CONFIG.penalties.filler * fillerRate +
    SCORING_CONFIG.penalties.shortSentence * shortPenalty;

  const baseScore =
    SCORING_CONFIG.weights.word * wordScore +
    SCORING_CONFIG.weights.length * lengthScore;

  const totalScore = clamp01(baseScore - penalty + SCORING_CONFIG.scoreNudge);

  const level = mapTotalScoreToLevel(totalScore);

  const scores: OpicEvaluationScores = {
    wordScore,
    lengthScore,
    penalty,
  };

  const notes = [
    `단어 수 점수: ${(wordScore * 100).toFixed(0)}% (단어 ${wordCount}/${SCORING_CONFIG.wordTarget})`,
    `문장 길이 점수: ${(lengthScore * 100).toFixed(0)}% (평균 ${averageSentenceLength.toFixed(1)}어 / 목표 ${SCORING_CONFIG.lengthTarget})`,
    `감점 요인(반복·군더더기·짧은 문장): ${(penalty * 100).toFixed(0)}%`,
  ];

  const reasonSummary = `단어 수와 평균 문장 길이를 기준으로 계산된 총점 ${(
    totalScore * 100
  ).toFixed(0)}% → ${level} 등급입니다.`;

  return {
    level,
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
