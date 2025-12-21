export type LevelId =
  | "NL"
  | "NM"
  | "NH"
  | "IL"
  | "IM1"
  | "IM2"
  | "IM3"
  | "IH"
  | "AL";

export type LevelOption = {
  id: LevelId;
  title: string;
  description: string;
};

export const LEVEL_OPTIONS: LevelOption[] = [
  {
    id: "IL",
    title: "IL",
    description: "기본적인 일상 대화를 짧게 이어갈 수 있는 수준",
  },
  {
    id: "IM1",
    title: "IM1",
    description: "친숙한 주제를 중심으로 간단히 설명할 수 있는 수준",
  },
  {
    id: "IM2",
    title: "IM2",
    description: "경험을 조금 더 구체적으로 묘사하고 이어갈 수 있는 수준",
  },
  {
    id: "IM3",
    title: "IM3",
    description: "다양한 상황을 비교·설명하며 대화를 이어갈 수 있는 수준",
  },
  {
    id: "IH",
    title: "IH",
    description: "생각과 이유를 논리적으로 전달하며 상세히 설명할 수 있는 수준",
  },
  {
    id: "AL",
    title: "AL",
    description: "폭넓은 주제를 자연스럽게 다루며 설득력 있게 말할 수 있는 수준",
  },
];

export const TARGET_LEVEL_STORAGE_KEY = "opic_target_level";
