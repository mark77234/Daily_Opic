import type { LevelId } from "./opic";

export const ANALYSIS_DURATION_MS = 2000;

export const DEFAULT_TRANSCRIPT =
  "Oh, I really enjoy traveling. Recently, I went to Busan with my family and we had a great time by the beach.";

export const FEEDBACK_BY_LEVEL: Record<LevelId, string> = {
  NL: "단어 중심으로만 말하고 있어요. 아주 짧은 완전한 문장(주어+동사)부터 연습해 보세요.",
  NM: "짧은 틀 문장이 반복됩니다. 두세 개 문장을 이어서 한 사건을 설명하는 연습이 필요해요.",
  NH: "기본 문장은 있지만 세부 정보가 부족합니다. 시간 표현과 장소·이유를 덧붙여 길이를 늘려 보세요.",
  IL: "단순한 문장 나열 단계입니다. 연결어(so, because)로 문장을 묶고 군더더기를 줄여 보세요.",
  IM1: "짧은 문단을 만들고 있습니다. 사건 순서를 맞춰 말하고, 반복 어휘를 줄이면 IM2로 갈 수 있어요.",
  IM2: "연결어와 시제 전환이 보입니다. 각 문장에 이유/결과를 추가해 응집력을 더 높여 보세요.",
  IM3: "담화 전개가 안정적입니다. 세부 묘사(숫자, 감정)를 넣고 복합 문장 비율을 높이면 IH에 근접합니다.",
  IH: "잘 연결된 담화가 보입니다. 더 긴 설명과 예시, 대조를 넣으면 AL에 도달할 수 있어요.",
  AL: "장문 담화가 가능하며 구조가 명확합니다. 같은 수준을 유지하며 발화 속도를 안정적으로 관리하세요.",
};

export const SAMPLE_ANSWER_BY_LEVEL: Record<LevelId, { en: string; ko: string }> = {
  NL: {
    en: "I like coffee. I drink it in the morning. It helps me wake up.",
    ko: "저는 커피를 좋아해요. 아침에 마시고 잠을 깨는 데 도움이 됩니다.",
  },
  NM: {
    en: "I usually go to a park near my house. I walk with my friend and take pictures. It is simple but fun.",
    ko: "저는 집 근처 공원에 자주 가요. 친구와 산책하며 사진을 찍는데, 단순하지만 재미있어요.",
  },
  NH: {
    en: "Last weekend I visited my parents. We cooked dinner together and talked about our week. It was relaxing and nice.",
    ko: "지난 주말 부모님 댁에 다녀왔어요. 함께 저녁을 만들고 한 주 동안 있었던 일을 이야기했는데, 편안하고 좋았습니다.",
  },
  IL: {
    en: "I like traveling to cities by train because it is comfortable. I plan the schedule, visit two or three places, and take many photos.",
    ko: "저는 기차로 도시 여행하는 것을 좋아해요. 편안해서고, 일정을 미리 세워 두세 곳을 방문하며 사진을 많이 찍습니다.",
  },
  IM1: {
    en: "Recently I moved to a new apartment. First I packed everything, then my friends helped me move, and finally I set up the furniture. It was tiring but exciting.",
    ko: "최근에 새 아파트로 이사했어요. 먼저 짐을 싸고 친구들이 도와줘서 옮겼으며, 마지막으로 가구를 설치했습니다. 힘들었지만 설렜어요.",
  },
  IM2: {
    en: "I enjoy cooking on weekends. I check recipes, prepare ingredients in advance, and try to add my own seasoning. Sometimes it fails, but I learn and adjust the next time.",
    ko: "주말마다 요리하는 것을 좋아해요. 레시피를 확인하고 재료를 미리 손질한 뒤 제 식대로 간을 해봅니다. 가끔 실패해도 다음에 수정하며 배우고 있어요.",
  },
  IM3: {
    en: "I once organized a charity event at school. I coordinated with classmates, created a schedule, and contacted local businesses for support. Although we faced delays, we solved them by sharing tasks, and the event raised more than we expected.",
    ko: "예전에 학교에서 자선행사를 진행했어요. 친구들과 역할을 나누고 일정을 만들며, 지역 가게들과 연락해 도움을 받았습니다. 지연이 있었지만 일을 나누어 해결했고 예상보다 많은 기금을 모았습니다.",
  },
  IH: {
    en: "When I prepared for a presentation at work, I first outlined the main message, then added supporting stories from past projects. I practiced transitions to keep the flow and anticipated questions, which helped me handle the Q&A confidently.",
    ko: "회사 발표를 준비할 때 핵심 메시지를 잡고, 이전 프로젝트에서 나온 사례를 덧붙였습니다. 흐름을 위해 전환 표현을 연습했고 예상 질문을 준비해 자신 있게 Q&A를 진행할 수 있었습니다.",
  },
  AL: {
    en: "To improve my English, I designed a study routine that mixes input and output. In the morning I read news articles and summarize them, and in the evening I record myself explaining the same topics with connectors and comparisons. Reviewing these recordings weekly has shown clear progress.",
    ko: "영어 실력을 높이기 위해 입력과 출력을 섞은 루틴을 만들었어요. 아침에는 뉴스 기사를 읽고 요약하며, 저녁에는 같은 주제를 연결어와 비교 표현을 넣어 설명하면서 녹음합니다. 녹음을 주 단위로 다시 들으며 피드백하니 성과가 보입니다.",
  },
};
