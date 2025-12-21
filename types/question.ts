import type { LevelId } from "@/constants/opic";

export type QuestionDoc = {
  id: string;
  questionText: string;
  exampleAnswer: string;
  category: string;
  tags: string[];
  level: LevelId;
  createdAt: Date;
};

export type QuestionFilters = {
  category: string | null;
  tags: string[];
  level: LevelId | null;
};
